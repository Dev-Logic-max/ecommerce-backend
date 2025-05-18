import { Injectable, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService, // ✅ Correctly Injected
        private readonly jwtService: JwtService,
    ) {
        console.log("✅ PrismaService initialized:", prisma);
    }

    async signup(dto: SignupDto) {
        console.log("✅ Signup endpoint hit \n Signup DTO received:", dto); // ✅ Debug log

        // Check if PrismaService is defined
        if (!this.prisma) {
            throw new Error("❌ PrismaService is not initialized");
        }

        const { username, email, phone, password } = dto;

        // Check if username exists
        const existingUser = await this.prisma.user.findUnique({
            where: { username },
        });
        if (existingUser) {
            console.error("❌ Error: Username already exists");
            throw new ConflictException('Username already exists');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user with Customer role
        const user = await this.prisma.user.create({
            data: {
                username,
                email,
                phone,
                password: hashedPassword,
                role: { connect: { name: 'Customer' } },
            },
        });

        // Generate JWT
        const payload = { sub: user.id, username: user.username, role: user.roleId };
        const token = this.jwtService.sign(payload);

        console.log("User created:", user); // ✅ Debug log

        return { token, user: { id: user.id, username: user.username, role: user.roleId } };
    }

    async login(dto: LoginDto) {
        const { username, password } = dto;

        // Find user
        const user = await this.prisma.user.findUnique({
            where: { username },
        });
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Generate JWT
        const payload = { sub: user.id, username: user.username, role: user.roleId };
        const token = this.jwtService.sign(payload);

        return { token, user: { id: user.id, username: user.username, role: user.roleId } };
    }

    async createUser(dto: CreateUserDto) {
        const { username, email, phone, password, role } = dto;

        const existingUser = await this.prisma.user.findUnique({ where: { username } });
        if (existingUser) {
            throw new ConflictException('Username already exists');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const roleEntity = await this.prisma.role.findUnique({ where: { name: role } });
        if (!roleEntity) {
            throw new NotFoundException(`Role ${role} not found`);
        }

        const user = await this.prisma.user.create({
            data: {
                username,
                email,
                phone,
                password: hashedPassword,
                role: { connect: { id: roleEntity.id } },
            },
        });

        return { user: { id: user.id, username: user.username, role: user.roleId } };
    }
}