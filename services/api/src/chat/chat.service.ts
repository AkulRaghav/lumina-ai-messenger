import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { connect } from 'nats';

@Injectable()
export class ChatService {
  private natsClient;

  constructor(private prisma: PrismaService) {
    (async () => {
      try {
        this.natsClient = await connect({ servers: process.env.NATS_URL });
      } catch (e) {
        console.error('NATS connection failed');
      }
    })();
  }

  async createChat(userId: string, isGroup: boolean, memberIds: string[]) {
    // Validate all member IDs exist
    const existingUsers = await this.prisma.user.findMany({
      where: { id: { in: memberIds } },
      select: { id: true },
    });

    if (existingUsers.length !== memberIds.length) {
      throw new ForbiddenException('One or more member IDs are invalid');
    }

    const chat = await this.prisma.chat.create({
      data: {
        isGroup,
        members: {
          create: [
            { userId },
            ...memberIds
              .filter((id) => id !== userId) // Prevent duplicate self-add
              .map((id) => ({ userId: id })),
          ],
        },
      },
    });
    return chat;
  }

  async sendMessage(userId: string, chatId: string, content: string) {
    // Membership already verified by ChatMembershipGuard
    const message = await this.prisma.message.create({
      data: { chatId, senderId: userId, content },
      include: { sender: { select: { name: true, avatar: true } } },
    });

    if (this.natsClient) {
      this.natsClient.publish(
        `chat.${chatId}.messages`,
        JSON.stringify(message),
      );
    }
    return message;
  }

  async getMessages(chatId: string, take: number = 50) {
    // Membership already verified by ChatMembershipGuard
    return this.prisma.message.findMany({
      where: { chatId },
      take: Math.min(take, 100), // Cap at 100 to prevent excessive queries
      orderBy: { createdAt: 'desc' },
      include: { sender: { select: { name: true, avatar: true } } },
    });
  }

  async getUserChats(userId: string) {
    const members = await this.prisma.chatMember.findMany({
      where: { userId },
      include: {
        chat: {
          include: {
            messages: { orderBy: { createdAt: 'desc' }, take: 1 },
            members: {
              include: { user: { select: { name: true, avatar: true } } },
            },
          },
        },
      },
    });
    return members.map((m) => m.chat);
  }
}
