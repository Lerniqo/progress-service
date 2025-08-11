import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const host = configService.get<string>('MONGODB_HOST', 'localhost');
        const port = configService.get<string>('MONGODB_PORT', '27017');
        const username = configService.get<string>('MONGODB_USERNAME');
        const password = configService.get<string>('MONGODB_PASSWORD');
        const database = configService.get<string>('MONGODB_DATABASE');

        // Construct MongoDB URI
        let uri: string;
        if (username && password) {
          // For MongoDB with authentication, we need to authenticate against the admin database
          // but connect to our specific database
          uri = `mongodb://${username}:${password}@${host}:${port}/${database}?authSource=admin`;
        } else {
          uri = `mongodb://${host}:${port}/${database}`;
        }

        // Use environment variable if provided, otherwise use constructed URI
        const mongoUri = configService.get<string>('MONGODB_URI', uri);

        console.log(`Connecting to MongoDB at: ${mongoUri.replace(/:[^:@]*@/, ':****@')}`);

        return {
          uri: mongoUri,
          // Connection pool settings
          maxPoolSize: 10,
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
          connectTimeoutMS: 10000,
          // Retry settings
          retryWrites: true,
          retryReads: true,
        };
      },
      inject: [ConfigService],
    }),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}
