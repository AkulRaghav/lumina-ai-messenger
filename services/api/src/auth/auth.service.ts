import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

const BCRYPT_ROUNDS = 12;
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_DAYS = 30;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;

@Injectable()
export class AuthService {
  // In-memory login attempt tracking (use Redis in production)
  private loginAttempts = new Map<string, { count: number; lockedUntil?: Date }>();

  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  async register(email: string, name: string, password: string) {
    const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await this.prisma.user.create({
      data: { email: email.toLowerCase().trim(), name, password: hash },
    });
    return this.generateTokenPair(user.id, user.email);
  }

  async login(email: string, password: string) {
    const normalizedEmail = email.toLowerCase().trim();

    // Check lockout
    this.checkLockout(normalizedEmail);

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      this.recordFailedAttempt(normalizedEmail);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Clear failed attempts on successful login
    this.loginAttempts.delete(normalizedEmail);

    return this.generateTokenPair(user.id, user.email);
  }

  async refreshToken(refreshToken: string) {
    let payload: any;
    try {
      payload = this.jwt.verify(refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid token type');
    }

    // Verify user still exists
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Issue new token pair (rotation)
    return this.generateTokenPair(user.id, user.email);
  }

  private generateTokenPair(userId: string, email: string) {
    const accessToken = this.jwt.sign(
      { sub: userId, email, type: 'access' },
      { expiresIn: ACCESS_TOKEN_EXPIRY },
    );

    const refreshToken = this.jwt.sign(
      { sub: userId, type: 'refresh' },
      { expiresIn: `${REFRESH_TOKEN_EXPIRY_DAYS}d` },
    );

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: 900, // 15 minutes in seconds
    };
  }

  private checkLockout(email: string) {
    const record = this.loginAttempts.get(email);
    if (record?.lockedUntil && record.lockedUntil > new Date()) {
      const remainingMs = record.lockedUntil.getTime() - Date.now();
      const remainingMin = Math.ceil(remainingMs / 60000);
      throw new ForbiddenException(
        `Account locked. Try again in ${remainingMin} minutes.`,
      );
    }
  }

  private recordFailedAttempt(email: string) {
    const record = this.loginAttempts.get(email) || { count: 0 };
    record.count++;

    if (record.count >= MAX_LOGIN_ATTEMPTS) {
      record.lockedUntil = new Date(
        Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000,
      );
    }

    this.loginAttempts.set(email, record);
  }
}
