import { Injectable, ConflictException, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRoleDto } from '../auth/dto/role.dto';
import { RoleRequestDto } from '../auth/dto/role-request.dto';

@Injectable()
export class ConnectionService {
    constructor(private readonly prisma: PrismaService) { }

    // 🛠️ Role Management APIs logic

    async createRole(dto: CreateRoleDto) {
        const { name } = dto;
        const existingRole = await this.prisma.role.findUnique({ where: { name } });
        if (existingRole) {
            throw new ConflictException('Role already exists');
        }
        const role = await this.prisma.role.create({
            data: { name },
        });
        return { role: { id: role.id, name: role.name } };
    }

    async requestRole(userId: number, dto: RoleRequestDto) {
        const { requestedRole } = dto;
        const validRoles = ['Retailer', 'Merchant', 'Supplier', 'Courier', 'Customer'];
        if (!validRoles.includes(requestedRole)) {
            throw new BadRequestException('Invalid role requested');
        }

        // Check for any pending request
        const existingRequest = await this.prisma.roleRequest.findFirst({
            where: { userId, status: 'PENDING', requestedRole },
        });
        if (existingRequest) {
            // Allow updating the existing request if it's the same role or a new role
            if (existingRequest.requestedRole === requestedRole) {
                throw new ConflictException('Pending request already exists for this role');
            }
            // Update existing request with new role
            return await this.prisma.roleRequest.update({
                where: { id: existingRequest.id },
                data: { requestedRole, updatedAt: new Date() },
            });
            // throw new ConflictException('Pending request already exists for this role');
        }

        // Verify user exists before creating request
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException('User not found');
        }
        // Create new request if no pending request exists
        return await this.prisma.roleRequest.create({
            data: { userId, requestedRole },
        });
    }

    async getRoleRequests(userId: number) {
        try {
            console.log('Fetching role requests for userId:', userId); // Debug log
            if (!userId || isNaN(userId)) {
                throw new UnauthorizedException('Invalid user ID');
            }
            const user = await this.prisma.user.findUnique({ where: { id: userId } });
            if (!user || user.roleId !== 1) {
                throw new UnauthorizedException('Only Developer can view role requests');
            }
            const requests = await this.prisma.roleRequest.findMany({
                // Fetch all requests, not just PENDING
                // where: { status: 'PENDING' },
                include: { user: { include: { role: true } } }, // Include role name
            });
            return requests.length > 0 ? requests : []; // Return empty array if no requests
        } catch (error) {
            console.error('Error fetching role requests:', error);
            throw error; // Let the controller handle the error
        }
    }

    async getUserRoleRequests(userId: number) {
        return await this.prisma.roleRequest.findMany({
            where: { userId },
            orderBy: { updatedAt: 'desc' },
        });
    }

    async approveRoleRequest(requestId: number, adminId: number) {
        const developerRoleId = 1; // Assuming Developer role ID is 1 (from seed.ts)
        const admin = await this.prisma.user.findUnique({ where: { id: adminId } });
        if (!admin || admin.roleId !== developerRoleId) {
            throw new UnauthorizedException('Only Developer can approve requests');
        }

        const request = await this.prisma.roleRequest.findUnique({ where: { id: requestId }, include: { user: true }, });
        if (!request || request.status !== 'PENDING') {
            throw new NotFoundException('Pending request not found');
        }

        const roleEntity = await this.prisma.role.findUnique({
            where: { name: request.requestedRole },
        });
        if (!roleEntity) {
            throw new NotFoundException(`Role ${request.requestedRole} not found`);
        }

        // Update user role
        await this.prisma.user.update({
            where: { id: request.userId },
            data: { roleId: roleEntity.id },
        });

        // Update role request with admin relation
        return await this.prisma.roleRequest.update({
            where: { id: requestId },
            data: { status: 'APPROVED', adminId },
            include: { user: true },
        });
    }

    async rejectRoleRequest(requestId: number, adminId: number) {
        const developerRoleId = 1; // Assuming Developer role ID is 1
        const admin = await this.prisma.user.findUnique({ where: { id: adminId } });
        if (!admin || admin.roleId !== developerRoleId) {
            throw new UnauthorizedException('Only Developer can reject requests');
        }

        const request = await this.prisma.roleRequest.findUnique({ where: { id: requestId }, include: { user: true } });
        if (!request || request.status !== 'PENDING') {
            throw new NotFoundException('Pending request not found');
        }

        return await this.prisma.roleRequest.update({
            where: { id: requestId },
            data: { status: 'REJECTED', adminId },
            include: { user: true },
        });
    }
}