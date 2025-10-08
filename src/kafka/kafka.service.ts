import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino/PinoLogger';
import {
  Kafka,
  Producer,
  Consumer,
  ProducerRecord,
  ConsumerSubscribeTopics,
  EachMessagePayload,
  ConsumerRunConfig,
  Admin,
} from 'kafkajs';
import { KafkaConfigService } from './kafka-config.service';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger: PinoLogger;
  private kafka: Kafka;
  private producer: Producer;
  private consumer: Consumer;
  private admin: Admin;
  private isProducerConnected = false;
  private isConsumerConnected = false;

  constructor(
    private readonly kafkaConfigService: KafkaConfigService,
    logger: PinoLogger,
  ) {
    this.logger = logger;
    this.logger.setContext(KafkaService.name);
    const config = this.kafkaConfigService.createKafkaConfig();
    this.kafka = new Kafka(config);
    this.producer = this.kafka.producer();
    this.consumer = this.kafka.consumer({
      groupId: this.kafkaConfigService.getGroupId(),
    });
    this.admin = this.kafka.admin();
  }

  async onModuleInit() {
    await this.connectProducer();
    this.logger.info('Kafka service initialized');
  }

  async onModuleDestroy() {
    await this.disconnect();
    this.logger.info('Kafka service destroyed');
  }

  /**
   * Connect the producer
   */
  async connectProducer(): Promise<void> {
    try {
      if (!this.isProducerConnected) {
        await this.producer.connect();
        this.isProducerConnected = true;
        this.logger.info('Kafka producer connected successfully');
      }
    } catch (error) {
      this.logger.error('Failed to connect Kafka producer', error);
      throw error;
    }
  }

  /**
   * Connect the consumer
   */
  async connectConsumer(): Promise<void> {
    try {
      if (!this.isConsumerConnected) {
        await this.consumer.connect();
        this.isConsumerConnected = true;
        this.logger.info('Kafka consumer connected successfully');
      }
    } catch (error) {
      this.logger.error('Failed to connect Kafka consumer', error);
      throw error;
    }
  }

  /**
   * Disconnect producer and consumer
   */
  async disconnect(): Promise<void> {
    try {
      if (this.isProducerConnected) {
        await this.producer.disconnect();
        this.isProducerConnected = false;
        this.logger.info('Kafka producer disconnected');
      }

      if (this.isConsumerConnected) {
        await this.consumer.disconnect();
        this.isConsumerConnected = false;
        this.logger.info('Kafka consumer disconnected');
      }

      await this.admin.disconnect();
      this.logger.info('Kafka admin disconnected');
    } catch (error) {
      this.logger.error('Error disconnecting from Kafka', error);
    }
  }

  /**
   * Send a single message to a topic
   */
  async sendMessage(topic: string, message: any): Promise<void> {
    try {
      await this.connectProducer();

      const messagePayload = {
        value: JSON.stringify(message),
        timestamp: Date.now().toString(),
      };

      const result = await this.producer.send({
        topic,
        messages: [messagePayload],
      });

      this.logger.info(
        `Message sent to topic ${topic}: ${JSON.stringify(result)}`,
      );
    } catch (error) {
      this.logger.error(`Failed to send message to topic ${topic}`, error);
      throw error;
    }
  }

  /**
   * Send multiple messages to a topic
   */
  async sendMessages(topic: string, messages: any[]): Promise<void> {
    try {
      await this.connectProducer();

      const messagePayloads = messages.map((message) => ({
        value: JSON.stringify(message),
        timestamp: Date.now().toString(),
      }));

      const result = await this.producer.send({
        topic,
        messages: messagePayloads,
      });

      this.logger.info(
        `${messages.length} messages sent to topic ${topic}: ${JSON.stringify(result)}`,
      );
    } catch (error) {
      this.logger.error(`Failed to send messages to topic ${topic}`, error);
      throw error;
    }
  }

  /**
   * Send a message with a specific key (for partitioning)
   */
  async sendMessageWithKey(
    topic: string,
    key: string,
    message: any,
  ): Promise<void> {
    try {
      await this.connectProducer();

      const result = await this.producer.send({
        topic,
        messages: [
          {
            key,
            value: JSON.stringify(message),
            timestamp: Date.now().toString(),
          },
        ],
      });

      this.logger.info(
        `Message with key ${key} sent to topic ${topic}: ${JSON.stringify(result)}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send message with key to topic ${topic}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Send a batch of messages (lower level API)
   */
  async sendBatch(record: ProducerRecord): Promise<void> {
    try {
      await this.connectProducer();
      const result = await this.producer.send(record);
      this.logger.info(`Batch sent successfully: ${JSON.stringify(result)}`);
    } catch (error) {
      this.logger.error('Failed to send batch', error);
      throw error;
    }
  }

  /**
   * Subscribe to topics and start consuming
   */
  async subscribe(
    topics: ConsumerSubscribeTopics,
    config: ConsumerRunConfig,
  ): Promise<void> {
    try {
      await this.connectConsumer();
      await this.consumer.subscribe(topics);
      await this.consumer.run(config);
      this.logger.info(
        `Consumer subscribed to topics: ${JSON.stringify(topics)}`,
      );
    } catch (error) {
      this.logger.error('Failed to subscribe to topics', error);
      throw error;
    }
  }

  /**
   * Subscribe to a single topic with a message handler
   */
  async consumeMessages(
    topic: string,
    onMessage: (payload: EachMessagePayload) => Promise<void>,
  ): Promise<void> {
    try {
      await this.connectConsumer();

      await this.consumer.subscribe({
        topics: [topic],
        fromBeginning: false,
      });

      await this.consumer.run({
        eachMessage: async (payload: EachMessagePayload) => {
          const { topic, partition, message } = payload;
          this.logger.debug(
            `Received message from topic ${topic}, partition ${partition}, offset ${message.offset}`,
          );

          try {
            await onMessage(payload);
          } catch (error) {
            this.logger.error(
              `Error processing message from topic ${topic}`,
              error,
            );
            // Depending on your error handling strategy, you might want to:
            // - throw the error to stop consuming
            // - log and continue
            // - send to a dead letter queue
          }
        },
      });

      this.logger.info(`Started consuming messages from topic: ${topic}`);
    } catch (error) {
      this.logger.error(
        `Failed to consume messages from topic ${topic}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get the Kafka admin client for advanced operations
   */
  getAdmin(): Admin {
    return this.admin;
  }

  /**
   * Create topics (useful for development/testing)
   */
  async createTopics(topics: string[]): Promise<void> {
    try {
      await this.admin.connect();

      const topicConfigs = topics.map((topic) => ({
        topic,
        numPartitions: 3,
        replicationFactor: 1,
      }));

      await this.admin.createTopics({
        topics: topicConfigs,
        waitForLeaders: true,
      });

      this.logger.info(`Topics created: ${topics.join(', ')}`);

      await this.admin.disconnect();
    } catch (error) {
      this.logger.error('Failed to create topics', error);
      throw error;
    }
  }

  /**
   * List all topics
   */
  async listTopics(): Promise<string[]> {
    try {
      await this.admin.connect();
      const topics = await this.admin.listTopics();
      await this.admin.disconnect();
      return topics;
    } catch (error) {
      this.logger.error('Failed to list topics', error);
      throw error;
    }
  }

  /**
   * Delete topics
   */
  async deleteTopics(topics: string[]): Promise<void> {
    try {
      await this.admin.connect();
      await this.admin.deleteTopics({
        topics,
      });
      this.logger.info(`Topics deleted: ${topics.join(', ')}`);
      await this.admin.disconnect();
    } catch (error) {
      this.logger.error('Failed to delete topics', error);
      throw error;
    }
  }

  /**
   * Check if producer is connected
   */
  isProducerReady(): boolean {
    return this.isProducerConnected;
  }

  /**
   * Check if consumer is connected
   */
  isConsumerReady(): boolean {
    return this.isConsumerConnected;
  }
}
