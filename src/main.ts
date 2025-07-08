import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as dotenv from 'dotenv';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as express from 'express';
import * as path from 'path';

dotenv.config(); // ✅ Load .env variables

async function bootstrap() {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(), { bodyParser: true });

  app.use(express.json({ limit: '5mb' })); // Global limit for JSON
  app.use(express.urlencoded({ limit: '5mb', extended: true })); // Global limit for URL-encoded
  app.use(express.raw({ limit: '5mb', type: 'application/octet-stream' })); // For raw data if needed

  // app.use('/uploads', express.static(path.join(__dirname, '../uploads'))); // Adjust path based on your project structure
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  app.useGlobalPipes(new ValidationPipe()); // Add global validation

  // Enable CORS
  app.enableCors({
    // origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    origin: 'http://localhost:3000', // Allow frontend origin
    credentials: true,
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  // await app.listen(process.env.PORT ?? 3000);

  // 📒 Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('E-commerce API')
    .setDescription('API for e-commerce platform')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  console.log(`🚀 Backend is running successfully on: http://localhost:${port} 🚀`);
}
bootstrap();
