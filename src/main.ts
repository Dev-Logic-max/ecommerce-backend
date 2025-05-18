import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as dotenv from 'dotenv';

dotenv.config(); // Load .env variables

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe()); // Add global validation

  const port = process.env.PORT || 3000;
  await app.listen(port);

  // await app.listen(process.env.PORT ?? 3000);

  console.log(`🚀 Backend is running successfully on: http://localhost:${port} 🚀`);
}
bootstrap();
