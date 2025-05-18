import { Controller, Post, Body, ValidationPipe, UseGuards, Request, Get, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('auth') // ✅ Route is /auth
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('signup') // ✅ Route is /auth/signup
    async signup(@Body(ValidationPipe) dto: SignupDto) {
        return this.authService.signup(dto);
    }

    @Post('login') // ✅ Route is /auth/login
    async login(@Body(ValidationPipe) dto: LoginDto) {
        return this.authService.login(dto);
    }

    @UseGuards(JwtAuthGuard)
    @Get('verify') // ✅ Route is /auth/verify ➡️ (Authenticated)
    async verify(@Request() req) {
        return { message: 'Token is valid', user: req.user };
    }

    @UseGuards(JwtAuthGuard)
    @Post('create-user') // ✅ Route is /auth/create-user ➡️ (Authenticated)
    async createUser(@Body(ValidationPipe) dto: CreateUserDto, @Request() req) {
        // console.log(req.user);
        const userRole = req.user.role; // Role ID from token
        const allowedRoles = [1, 2, 3]; // Developer, PlatformAdmin, OperationsAdmin IDs
        if (!allowedRoles.includes(userRole)) {
            throw new UnauthorizedException('Only admins can create this user');
        }
        return this.authService.createUser(dto);
    }
}