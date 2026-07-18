import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

export type RolesOptions = { roles: string[] };

export const Roles = (options: RolesOptions) => SetMetadata(ROLES_KEY, options);
