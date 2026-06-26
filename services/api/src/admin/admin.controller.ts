import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminService } from './admin.service';
import { AdminRoleGuard } from './guards/admin-role.guard';

@Controller('admin')
@UseGuards(AuthGuard('jwt'), AdminRoleGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('metrics')
  async getMetrics() {
    return this.adminService.getDashboardMetrics();
  }

  @Get('analytics/messages-volume')
  async getMessageVolume() {
    return this.adminService.getMessageVolumeLast7Days();
  }

  @Get('analytics/top-chats')
  async getTopChats(@Query('limit') limit: string) {
    return this.adminService.getTopActiveChats(parseInt(limit) || 10);
  }
}
