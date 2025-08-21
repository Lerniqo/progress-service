import { Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { DatabaseConfigService } from './database-config.service';
import { DatabaseHealthService } from './database-health.service';
import {
  ProgressEvent,
  ProgressEventSchema,
} from '../schemas/progress-event.schema';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const logger = new Logger('DatabaseModule');
        const databaseConfig = new DatabaseConfigService(configService);

        try {
          const mongooseOptions = databaseConfig.createMongooseOptions();
          const sanitizedUri = databaseConfig.getSanitizedUri();

          logger.log(`Connecting to MongoDB at: ${sanitizedUri}`);

          return mongooseOptions;
        } catch (error: unknown) {
          logger.error(
            'Failed to create database configuration',
            error instanceof Error ? error.stack : String(error),
          );
          throw error;
        }
      },
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: ProgressEvent.name, schema: ProgressEventSchema },
    ]),
  ],
  providers: [DatabaseConfigService, DatabaseHealthService],
  exports: [MongooseModule, DatabaseConfigService, DatabaseHealthService],
})
export class DatabaseModule {}
