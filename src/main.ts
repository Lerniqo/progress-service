import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  
  // Use Pino logger
  app.useLogger(app.get(Logger));
  
  // Apply global HTTP exception filter
  app.useGlobalFilters(new HttpExceptionFilter());
  
  // Enable graceful shutdown hooks
  app.enableShutdownHooks();
  
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  
  const logger = app.get(Logger);
  logger.log(`🚀 Progress service is running on port ${port}`, 'Bootstrap');
}

bootstrap().catch((error) => {
  console.error('Failed to start the application:', error);
  process.exit(1);
});
