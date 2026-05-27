import { KafkaConsumer, Topics, UserCreatedEvent } from '@payflow/events';
import { UserService } from '../../application/services/userService';
import { logger } from '@payflow/logger';

const userService = new UserService();

export async function startUserConsumer(): Promise<void> {
  const consumer = new KafkaConsumer('user-service-group', 'user-service');

  await consumer.subscribe([Topics.USER_CREATED]);

  await consumer.run<UserCreatedEvent>(async (event) => {
    logger.info(`[UserConsumer] Received user.created for userId: ${event.userId}`);
    await userService.createProfile(event.userId, event.email);
  });

  logger.info('[UserConsumer] Listening on topic: user.created');

  const shutdown = async () => {
    await consumer.disconnect();
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}
