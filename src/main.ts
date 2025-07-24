import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(helmet());
  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('Car Wash API')
    .setDescription('A comprehensive Car Wash management system API')
    .setVersion('1.0')
    .addTag('users', 'User management operations')
    .addTag('auth', 'Authentication operations')
    .addTag('bookings', 'Booking management operations')
    .addTag('services', 'Car wash service operations')
    .addTag('fleet', 'Fleet vehicle management operations')
    .addTag('reviews', 'Review and rating operations')
    .addTag('payments', 'Payment processing operations')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Car Wash API Documentation',
    customfavIcon: '🚗',
  });

  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://car-wash-client-tau.vercel.app',
      'https://car-wash-client-p9dxulh7q-titus-waititus-projects.vercel.app',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  const configService = app.get(ConfigService);
  const PORT = configService.getOrThrow<number>('PORT', 8080);

  await app.listen(PORT);
  console.log('🚗 Car Wash API is running on http://localhost:' + PORT);
  console.log(
    '📚 API Documentation available at http://localhost:' + PORT + '/api/docs',
  );
}
bootstrap();
