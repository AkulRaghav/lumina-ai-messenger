import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboardMetrics() {
    const [totalUsers, totalMessages, activeUsers24h, storageUsed] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.message.count(),
        this.prisma.user.count({
          where: {
            lastSeen: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
        }),
        this._calculateStorageUsed(),
      ]);

    return {
      totalUsers,
      totalMessages,
      activeUsers24h,
      storageUsedGB: (storageUsed / (1024 * 1024 * 1024)).toFixed(2),
    };
  }

  async getMessageVolumeLast7Days() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const result: any[] = await this.prisma.$queryRaw`
      SELECT DATE("createdAt") as date, COUNT(*)::int as count
      FROM "messages"
      WHERE "createdAt" >= ${sevenDaysAgo}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `;

    return result.map((row) => ({
      date: row.date.toString(),
      count: row.count,
    }));
  }

  async getTopActiveChats(limit: number = 10) {
    const chats = await this.prisma.chat.findMany({
      take: limit,
      orderBy: { messages: { _count: 'desc' } },
      select: {
        id: true,
        name: true,
        type: true,
        _count: { select: { messages: true, members: true } },
      },
    });
    return chats;
  }

  private async _calculateStorageUsed(): Promise<number> {
    const mediaMessages = await this.prisma.message.count({
      where: { mediaUrl: { not: null } },
    });
    return mediaMessages * 2 * 1024 * 1024; // Assume 2MB per media
  }
}
