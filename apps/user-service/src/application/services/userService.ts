import { prisma } from '@payflow/db';
import { logger } from '@payflow/logger';

export class UserService {
  async createProfile(userId: string, email: string) {
    const [firstName, ...rest] = email.split('@')[0].split('.');
    
    // Use upsert to handle concurrent duplicate events gracefully
    const profile = await prisma.userProfile.upsert({
      where: { userId },
      update: {}, // no-op if exists
      create: {
        userId,
        firstName: firstName || 'User',
        lastName: rest.join(' ') || '',
        kycStatus: 'PENDING',
      },
    });

    logger.info(`[UserService] Profile processed for user: ${userId}`);
    return profile;
  }

  async getProfile(userId: string) {
    const profile = await prisma.userProfile.findUnique({
      where: { userId },
      include: { user: { select: { email: true, role: true, createdAt: true } } },
    });
    if (!profile) throw new Error('Profile not found');
    return profile;
  }

  async updateProfile(
    userId: string,
    data: {
      firstName?: string;
      lastName?: string;
      address?: string;
      city?: string;
      country?: string;
    }
  ) {
    const profile = await prisma.userProfile.findUnique({ where: { userId } });
    if (!profile) throw new Error('Profile not found');

    return prisma.userProfile.update({
      where: { userId },
      data,
    });
  }

  async updateKycStatus(userId: string, status: 'PENDING' | 'APPROVED' | 'REJECTED') {
    const profile = await prisma.userProfile.findUnique({ where: { userId } });
    if (!profile) throw new Error('Profile not found');

    return prisma.userProfile.update({
      where: { userId },
      data: { kycStatus: status },
    });
  }

  async listUsers(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [profiles, total] = await Promise.all([
      prisma.userProfile.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true, role: true } } },
      }),
      prisma.userProfile.count(),
    ]);
    return { profiles, total, page, limit };
  }
}
