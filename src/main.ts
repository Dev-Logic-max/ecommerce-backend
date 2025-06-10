import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as dotenv from 'dotenv';

dotenv.config(); // ✅ Load .env variables

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe()); // Add global validation

  // Enable CORS
  app.enableCors({
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
