import { Controller, Post, Body, UseGuards, Param, Get, Request, UnauthorizedException, InternalServerErrorException, ValidationPipe } from '@nestjs/common';
import { ConnectionService } from './connection.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RoleRequestDto } from '../auth/dto/role-request.dto';
import { CreateRoleDto } from '../auth/dto/role.dto';

@Controller('connection')
export class ConnectionController {
    constructor(private readonly ConnectionService: ConnectionService) { }

    // 🛠️ Role Management API endpoints
    
    @UseGuards(JwtAuthGuard)
    @Post('create-role') // 🌐 Route: /connection/create-role (Authenticated)
    async createRole(@Body(ValidationPipe) dto: CreateRoleDto, @Request() req) {
        const userRole = req.user.role; // Role ID from token
        const allowedRoles = [1, 2]; // Developer, PlatformAdmin
        if (!allowedRoles.includes(userRole)) {
            throw new UnauthorizedException('Only Developer or PlatformAdmin can create roles');
        }
        return this.ConnectionService.createRole(dto);
    }

    @UseGuards(JwtAuthGuard)
    @Post('role-request') // 🌐 Route: /connection/role-request (Authenticated)
    async requestRole(@Request() req, @Body(ValidationPipe) dto: RoleRequestDto) {
        return this.ConnectionService.requestRole(req.user.userId, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Get('role-requests') // 🌐 Route: /connection/role-requests (Authenticated)
    async getRoleRequests(@Request() req) {
        try {
            console.log('Request user for getting roles:', req.user); // Debug the received user object
            return this.ConnectionService.getRoleRequests(req.user.userId);
        } catch (error) {
            console.log('User from token during error:', req.user);
            if (error instanceof UnauthorizedException) throw error;
            throw new InternalServerErrorException('Failed to fetch role requests');
        }
    }

    @UseGuards(JwtAuthGuard)
    @Get('role-requests/user') // 🌐 Route: /connection/role-requests/user (Authenticated)
    async getUserRoleRequests(@Request() req) {
        return this.ConnectionService.getUserRoleRequests(req.user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @Post('role/approve/:id') // 🌐 Route: /connection/role/approve/:id (Authenticated)
    async approveRoleRequest(@Param('id') id: string, @Request() req) {
        return this.ConnectionService.approveRoleRequest(parseInt(id), req.user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @Post('role/reject/:id') // 🌐 Route: /connection/role/reject/:id (Authenticated)
    async rejectRoleRequest(@Param('id') id: string, @Request() req) {
        return this.ConnectionService.rejectRoleRequest(parseInt(id), req.user.userId);
    }
}