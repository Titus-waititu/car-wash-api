import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { BookingsModule } from './bookings/bookings.module';
import { ServicesModule } from './services/services.module';
import { ReviewsModule } from './reviews/reviews.module';
import { FleetModule } from './fleet/fleet.module';
import { PaymentsModule } from './payments/payments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
// import { CacheInterceptor, CacheModule } from '@nestjs/cache-manager';
// import { CacheableMemory } from 'cacheable';
// import { createKeyv, Keyv } from '@keyv/redis';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AtGuard } from './auth/guards/at.guard';
import { LoggerMiddleware } from 'logger.middleware';
import { CarWashLocationModule } from './car-wash-location/car-wash-location.module';
import { ChatbotModule } from './chatbot/chatbot.module';
import { MailModule } from './mail/mail.module';
import { InvoiceModule } from './invoice/invoice.module';

@Module({
  imports: [
    UsersModule,
    DatabaseModule,
    AuthModule,
    BookingsModule,
    ServicesModule,
    ReviewsModule,
    FleetModule,
    PaymentsModule,
    NotificationsModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.getOrThrow<number>('THROTTLE_TTL', {
            infer: true,
          }),
          limit: configService.getOrThrow<number>('THROTTLE_LIMIT', {
            infer: true,
          }),
          ignoreUserAgents: [/^curl\//, /^PostmanRuntime\//],
        },
      ],
    }),
    CarWashLocationModule,
    ChatbotModule,
    MailModule,
    InvoiceModule,
    // CacheModule.registerAsync({
    //   imports: [ConfigModule],
    //   inject: [ConfigService],
    //   isGlobal: true,
    //   useFactory: (configService: ConfigService) => {
    //     return {
    //       ttl: 60000, // Default TTL for cache entries
    //       stores: [
    //         // Memory store for fast local access
    //         new Keyv({
    //           store: new CacheableMemory({ ttl: 30000, lruSize: 5000 }),
    //         }),
    //         // Redis store for distributed caching
    //         createKeyv(configService.getOrThrow<string>('REDIS_URL')),
    //       ],
    //     };
    //   },
    // }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AtGuard,
    },
    // {
    //   provide: APP_INTERCEPTOR,
    //   useClass: CacheInterceptor,
    // },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
