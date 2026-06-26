import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
      algorithms: ['HS256'], // Pin algorithm — reject alg:none attacks
    });
  }

  async validate(payload: any) {
    // Reject refresh tokens used as access tokens
    if (payload.type === 'refresh') {
      throw new UnauthorizedException('Cannot use refresh token for API access');
    }
    return { userId: payload.sub, email: payload.email };
  }
}
