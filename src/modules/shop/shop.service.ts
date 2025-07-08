import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateShopDto } from '../auth/dto/create-shop.dto';
import { UpdateShopDto } from '../auth/dto/update-shop.dto';

@Injectable()
export class ShopService {
    constructor(private readonly prisma: PrismaService) { }

    // 🏪 Shops Management API logic

    async createShop(userId: number, dto: CreateShopDto) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user || ![4, 5].includes(user.roleId)) { // Retailer or Merchant
            throw new UnauthorizedException('Only Retailer or Merchant can create shops');
        }

        return await this.prisma.shop.create({
            data: {
                name: dto.name,
                description: dto.description,
                ownerId: userId,
                status: 'PENDING',
            },
        });
    }

    async updateShop(userId: number, shopId: number, dto: UpdateShopDto) {
        const shop = await this.prisma.shop.findUnique({ where: { id: shopId } });
        if (!shop || shop.ownerId !== userId) {
            throw new UnauthorizedException('Unauthorized to update this shop');
        }

        return await this.prisma.shop.update({
            where: { id: shopId },
            data: dto,
        });
    }

    async deleteShop(userId: number, shopId: number) {
        const shop = await this.prisma.shop.findUnique({ where: { id: shopId } });
        if (!shop || shop.ownerId !== userId) {
            throw new UnauthorizedException('Unauthorized to delete this shop');
        }

        return await this.prisma.shop.delete({ where: { id: shopId } });
    }

    async getUserShops(userId: number) {
        return await this.prisma.shop.findMany({
            where: { ownerId: userId },
            include: { owner: true },
        });
    }

    async getPendingShops() {
        return await this.prisma.shop.findMany({
            where: { status: 'PENDING' },
            include: { owner: { include: { role: true } } },
        });
    }

    async approveShop(shopId: number) {
        const shop = await this.prisma.shop.findUnique({ where: { id: shopId } });
        if (!shop) {
            throw new NotFoundException('Shop not found');
        }
        return await this.prisma.shop.update({
            where: { id: shopId },
            data: { status: 'APPROVED' },
        });
    }

    async rejectShop(shopId: number) {
        const shop = await this.prisma.shop.findUnique({ where: { id: shopId } });
        if (!shop) {
            throw new NotFoundException('Shop not found');
        }
        return await this.prisma.shop.update({
            where: { id: shopId },
            data: { status: 'REJECTED' },
        });
    }
}