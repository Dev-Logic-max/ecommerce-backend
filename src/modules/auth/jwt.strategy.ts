import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            // secretOrKey: process.env.JWT_SECRET,
            secretOrKey: configService.get<string>('JWT_SECRET') || 'a1b2c3d4e5f6g7h8i9j0kAdminDashboard!', // Use ConfigService
        });
    }

    async validate(payload: any) {
        if (!payload.sub || !payload.role || typeof payload.sub !== 'number' || typeof payload.role !== 'number') {
            throw new UnauthorizedException('Invalid token payload');
        }
        return { userId: payload.sub, username: payload.username, role: payload.role };
    }
}