import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ChatService } from './chat.service';
import { ChatMembershipGuard } from './guards/chat-membership.guard';
import { SendMessageDto } from './dto/send-message.dto';
import { CreateChatDto } from './dto/create-chat.dto';

@Controller('chats')
@UseGuards(AuthGuard('jwt'))
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Get()
  async getChats(@Req() req) {
    return this.chatService.getUserChats(req.user.userId);
  }

  @Post()
  async createChat(@Req() req, @Body() dto: CreateChatDto) {
    return this.chatService.createChat(
      req.user.userId,
      dto.isGroup,
      dto.memberIds,
    );
  }

  // IDOR protection: ChatMembershipGuard verifies user belongs to this chat
  @Post(':id/messages')
  @UseGuards(ChatMembershipGuard)
  async sendMessage(
    @Req() req,
    @Param('id') chatId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(req.user.userId, chatId, dto.content);
  }

  // IDOR protection: ChatMembershipGuard verifies user belongs to this chat
  @Get(':id/messages')
  @UseGuards(ChatMembershipGuard)
  async getMessages(@Param('id') chatId: string) {
    return this.chatService.getMessages(chatId);
  }
}
