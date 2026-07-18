import { Module } from '@nestjs/common';
import { ProductModule } from './product/product.module';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { OrderModule } from './order/order.module';
import { CommonModule } from './common/common.module';
import { ShoppingSessionModule } from './shopping-session/shopping-session.module';
import { CartItemModule } from './cart-item/cart-item.module';
import { JwtModule } from '@nestjs/jwt';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { toPublicKeyPem } from './common/util/keycloak-public-key';

@Module({
  imports: [
    SentryModule.forRoot(),
    ConfigModule.forRoot(),
    JwtModule.registerAsync({
      global: true,
      useFactory: () => ({
        publicKey: toPublicKeyPem(process.env.KEYCLOAK_REALM_PUBLIC_KEY),
      }),
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
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  controllers: [],
})
export class AppModule {}
