import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

/**
 * Guard that verifies the authenticated user is a member of the chat
 * specified by :id in the route params. Prevents IDOR attacks.
 */
@Injectable()
export class ChatMembershipGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId;
    const chatId = request.params?.id;

    if (!userId || !chatId) {
      throw new ForbiddenException('Missing authentication or chat ID');
    }

    const membership = await this.prisma.chatMember.findUnique({
      where: {
        chatId_userId: { chatId, userId },
      },
    });

    if (!membership) {
      throw new NotFoundException('Chat not found');
      // Intentionally says "not found" instead of "forbidden" to avoid
      // leaking that the chat exists (enumeration protection)
    }

    // Attach membership to request for downstream use
    request.chatMembership = membership;
    return true;
  }
}
