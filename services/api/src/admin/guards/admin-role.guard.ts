import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

/**
 * Guard that restricts access to admin endpoints.
 * In production, check a `role` field on the user record.
 * For now, this checks a hardcoded admin email list.
 */
@Injectable()
export class AdminRoleGuard implements CanActivate {
  private readonly adminEmails = (process.env.ADMIN_EMAILS || '').split(',');

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userEmail = request.user?.email;

    if (!userEmail || !this.adminEmails.includes(userEmail)) {
      throw new ForbiddenException('Admin access required');
    }

    return true;
  }
}
