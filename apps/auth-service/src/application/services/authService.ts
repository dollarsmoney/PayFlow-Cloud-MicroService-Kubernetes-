import { prisma } from '@payflow/db';
import { KafkaProducer, Topics, UserCreatedEvent } from '@payflow/events';
import { logger } from '@payflow/logger';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const producer = new KafkaProducer('auth-service');

export class AuthService {
  private jwtSecret = process.env.JWT_SECRET || 'super-secret';
  private jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'super-secret-refresh';

  async signup(email: string, password: string, name?: string) {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new Error('User already exists');

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, passwordHash, role: 'USER' },
    });

    // Publish event so user-service creates a profile and wallet-service creates a wallet.
    // Fire-and-forget with a 5 s timeout — Kafka being slow must NOT block the HTTP response.
    const event: UserCreatedEvent = {
      userId: user.id,
      email: user.email,
      timestamp: new Date().toISOString(),
    };
    const publishWithTimeout = Promise.race([
      producer.publish(Topics.USER_CREATED, event),
      new Promise<void>((_, reject) =>
        setTimeout(() => reject(new Error('Kafka publish timeout')), 5000)
      ),
    ]);
    publishWithTimeout
      .then(() => logger.info(`[AuthService] user.created event published: ${user.id}`))
      .catch((err) => logger.warn(`[AuthService] Kafka publish failed (non-fatal): ${err.message}`));

    // Auto-login: return tokens so the frontend can skip the login step
    const token = this.signAccessToken(user.id, user.role);
    const refreshToken = this.signRefreshToken(user.id);
    await redis.set(`refresh:${user.id}`, refreshToken, 'EX', 60 * 60 * 24 * 7);

    return {
      userId: user.id,
      email: user.email,
      name: name || null,
      token,
      accessToken: token,
      refreshToken,
    };
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('Invalid credentials');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new Error('Invalid credentials');

    const token = this.signAccessToken(user.id, user.role);
    const refreshToken = this.signRefreshToken(user.id);

    // Store refresh token in Redis (7 day TTL)
    await redis.set(`refresh:${user.id}`, refreshToken, 'EX', 60 * 60 * 24 * 7);

    logger.info(`[AuthService] User logged in: ${user.id}`);
    return { token, refreshToken, userId: user.id };
  }

  async refresh(refreshToken: string) {
    let payload: any;
    try {
      payload = jwt.verify(refreshToken, this.jwtRefreshSecret);
    } catch {
      throw new Error('Invalid or expired refresh token');
    }

    const userId = payload.userId as string;

    // Verify the refresh token is still the one we issued
    const stored = await redis.get(`refresh:${userId}`);
    if (stored !== refreshToken) throw new Error('Refresh token has been revoked');

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    // Rotate: issue new tokens
    const newAccessToken = this.signAccessToken(user.id, user.role);
    const newRefreshToken = this.signRefreshToken(user.id);
    await redis.set(`refresh:${userId}`, newRefreshToken, 'EX', 60 * 60 * 24 * 7);

    return { token: newAccessToken, refreshToken: newRefreshToken };
  }

  async logout(userId: string, token: string) {
    // Blacklist the access token until it expires (1 hour)
    await redis.set(`blacklist:${token}`, '1', 'EX', 60 * 60);
    // Delete refresh token
    await redis.del(`refresh:${userId}`);
    logger.info(`[AuthService] User logged out: ${userId}`);
  }

  async verifyToken(token: string): Promise<{ userId: string; role: string }> {
    const isBlacklisted = await redis.get(`blacklist:${token}`);
    if (isBlacklisted) throw new Error('Token has been revoked');

    const payload = jwt.verify(token, this.jwtSecret) as any;
    return { userId: payload.userId, role: payload.role };
  }

  private signAccessToken(userId: string, role: string): string {
    return jwt.sign({ userId, role }, this.jwtSecret, { expiresIn: '1h' });
  }

  private signRefreshToken(userId: string): string {
    return jwt.sign({ userId }, this.jwtRefreshSecret, { expiresIn: '7d' });
  }
}
