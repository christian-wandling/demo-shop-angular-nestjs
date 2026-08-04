import { Module } from '@nestjs/common';
import { ProductModule } from './product/product.module';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { OrderModule } from './order/order.module';
import { CommonModule } from './common/common.module';
import { ShoppingSessionModule } from './shopping-session/shopping-session.module';
import { CartItemModule } from './cart-item/cart-item.module';
import { JwtModule } from '@nestjs/jwt';
import { APP_FILTER, APP_GUARD, Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { createJwksSigningKeyResolver } from './common/guards/jwks-signing-key-resolver';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';

const issuerUrl = (): string => `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}`;

const jwksUri = (): string =>
  `${process.env.KEYCLOAK_INTERNAL_URL ?? process.env.KEYCLOAK_URL}/realms/${
    process.env.KEYCLOAK_REALM
  }/protocol/openid-connect/certs`;

@Module({
  imports: [
    SentryModule.forRoot(),
    ConfigModule.forRoot(),
    JwtModule.register({
      global: true,
    }),
    ThrottlerModule.forRoot([
      process.env.NODE_ENV === 'production'
        ? {
            ttl: 60 * 1000,
            limit: 100,
          }
        : {
            ttl: 60 * 1000,
            limit: 1000 * 1000,
          },
    ]),
    CommonModule,
    ProductModule,
    UserModule,
    CartItemModule,
    OrderModule,
    ShoppingSessionModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
    {
      provide: APP_GUARD,
      inject: [Reflector],
      useFactory: (reflector: Reflector) =>
        new JwtAuthGuard(reflector, createJwksSigningKeyResolver(jwksUri()), { issuer: issuerUrl() }),
    },
    {
      provide: APP_GUARD,
      inject: [Reflector],
      useFactory: (reflector: Reflector) => new RolesGuard(reflector, process.env.KEYCLOAK_CLIENT_API ?? ''),
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  controllers: [],
})
export class AppModule {}
