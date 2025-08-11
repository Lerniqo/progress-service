import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommonModule } from './common/common.module';
import { FiltersModule } from './common/filters/filters.module';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { ProgressEventsModule } from './progress-events/progress-events.module';
import { SchemasModule } from './schemas/schemas.module';
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
    CommonModule,
    FiltersModule,
    DatabaseModule,
    SchemasModule,
    HealthModule,
    ProgressEventsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
