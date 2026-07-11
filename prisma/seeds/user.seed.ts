import { PrismaClient, User } from '@prisma/client';
import { faker } from '@faker-js/faker';
import * as dotenv from 'dotenv';
import * as process from 'node:process';

interface UserIdentity {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface KeycloakAdminUser {
  access_token: string;
}

const getKeycloakUrl = (): string => `http://localhost:${process.env.KEYCLOAK_PORT ?? '8080'}`;

const getHasUser = async (prisma: PrismaClient, email: string): Promise<boolean> => {
  const user = await prisma.user.findFirst({
    where: {
      email,
    },
  });

  return !!user;
};

export const seedUsers = async (prisma: PrismaClient): Promise<User[]> => {
  console.log('Seeding users...');

  dotenv.config();

  const users: User[] = [];

  for (const keycloakUserId of await getKeycloakUserIds()) {
    const hasUser = await getHasUser(prisma, keycloakUserId.email);

    if (hasUser) {
      continue;
    }

    const user = await prisma.user.create({
      data: {
        firstname: keycloakUserId.firstName,
        lastname: keycloakUserId.lastName,
        keycloak_user_id: keycloakUserId.id,
        email: keycloakUserId.email,
        phone: faker.helpers.fromRegExp('+[0-9]{9}'),
        address: {
          create: {
            street: faker.location.streetAddress(),
            apartment: faker.number.int({ max: 100 }).toString(),
            city: faker.location.city(),
            zip: faker.location.zipCode('#####'),
            region: faker.location.state(),
            country: 'United States',
          },
        },
      },
    });

    users.push(user);
  }

  console.log(`Seeding complete: Added ${users.length} user(s)`);

  return users;
};

const getKeycloakAdminToken = async (): Promise<KeycloakAdminUser> => {
  try {
    const username = process.env.KEYCLOAK_ADMIN as string;
    const password = process.env.KEYCLOAK_ADMIN_PASSWORD as string;
    const url = `${getKeycloakUrl()}/realms/master/protocol/openid-connect/token`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        username,
        password,
        grant_type: 'password',
        client_id: 'admin-cli',
      }),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      console.error(`Error: ${res.statusText}, Body: ${errorBody}`);
      throw new Error(`Error: ${res.statusText}, Body: ${errorBody}`);
    }

    return (await res.json()) as KeycloakAdminUser;
  } catch (err: any) {
    throw new Error(err.message);
  }
};

const getKeycloakUserIds = async (): Promise<UserIdentity[]> => {
  const { access_token } = await getKeycloakAdminToken();
  const url = `${getKeycloakUrl()}/admin/realms/demo_shop/users`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    const data = (await res.json()) as any;

    if (!res.ok) {
      throw new Error(res.statusText);
    }

    return data;
  } catch (err: any) {
    throw new Error(err.message);
  }
};
