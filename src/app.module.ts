import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { ProgressEventsModule } from './progress-events/progress-events.module';
import { validate } from './database/database-config.validation';
import { pinoConfig } from './common/logging/pino.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      cache: true,
      validate,
      expandVariables: true,
    }),
    LoggerModule.forRoot(pinoConfig),
    DatabaseModule,
    HealthModule,
    ProgressEventsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
