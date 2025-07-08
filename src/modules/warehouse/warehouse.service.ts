import { Injectable, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateWarehouseDto } from '../auth/dto/create-warehouse.dto';
import { CreateWarehouseProductDto } from '../auth/dto/create-warehouse-product.dto';
import { UpdateWarehouseProductDto } from '../auth/dto/update-warehouse-product.dto';

@Injectable()
export class WarehouseService {
    constructor(private readonly prisma: PrismaService) { }

    // 🏬 Warehouse Management APIs logic

    async createWarehouse(supplierId: number, dto: CreateWarehouseDto) {
        const existingWarehouse = await this.prisma.warehouse.findUnique({ where: { supplierId } });
        if (existingWarehouse) {
            throw new ConflictException('Warehouse already exists for this supplier');
        }
        return await this.prisma.warehouse.create({
            data: {
                supplierId,
                name: dto.name,
                location: dto.location,
                description: dto.description,
                warehouseIcon: dto.warehouseIcon,
                capacity: dto.capacity,
            },
        });
    }

    async updateWarehouse(supplierId: number, data: { name?: string; location?: string }) {
        return await this.prisma.warehouse.update({
            where: { supplierId },
            data,
        });
    }

    async deleteWarehouse(supplierId: number) {
        const warehouse = await this.prisma.warehouse.findUnique({ where: { supplierId } });
        if (!warehouse) {
            throw new NotFoundException('Warehouse not found for this supplier');
        }
        return await this.prisma.warehouse.delete({ where: { supplierId } });
    }

    async getPendingWarehouses() {
        return await this.prisma.warehouse.findMany({
            where: { status: 'PENDING' },
            include: { supplier: { include: { role: true } } },
        });
    }

    async approveWarehouse(warehouseId: number) {
        const warehouse = await this.prisma.warehouse.findUnique({ where: { id: warehouseId } });
        if (!warehouse) {
            throw new NotFoundException('Warehouse not found');
        }
        return await this.prisma.warehouse.update({
            where: { id: warehouseId },
            data: { status: 'APPROVED' },
        });
    }

    async rejectWarehouse(warehouseId: number) {
        const warehouse = await this.prisma.warehouse.findUnique({ where: { id: warehouseId } });
        if (!warehouse) {
            throw new NotFoundException('Warehouse not found');
        }
        return await this.prisma.warehouse.update({
            where: { id: warehouseId },
            data: { status: 'REJECTED' },
        });
    }

    async getWarehouse(supplierId: number) {
        return await this.prisma.warehouse.findUnique({
            where: { supplierId },
            include: { products: true },
        });
    }

    async getWarehouseProducts(warehouseId: number) {
        return await this.prisma.product.findMany({
            where: { warehouseId },
            include: { warehouse: true },
        });
    }

    async createWarehouseProduct(supplierId: number, data: CreateWarehouseProductDto) {
        if (await this.prisma.warehouse.findUnique({ where: { supplierId } }) === null) {
            throw new NotFoundException('Warehouse not found for this supplier');
        }
        return await this.prisma.product.create({
            data: {
                name: data.name,
                description: data.description,
                price: data.price,
                stock: data.stock,
                warehouseId: supplierId,
            },
        });
    }

    async updateWarehouseProduct(productId: number, supplierId: number, data: UpdateWarehouseProductDto) {
        const product = await this.prisma.product.findUnique({ where: { id: productId }, include: { warehouse: true } });
        if (!product || !product.warehouse || product.warehouse.supplierId !== supplierId) {
            throw new UnauthorizedException('You do not own this product');
        }
        return await this.prisma.product.update({
            where: { id: productId },
            data: {
                name: data.name,
                description: data.description,
                price: data.price,
                stock: data.stock,
            },
        });
    }

    async deleteWarehouseProduct(productId: number, supplierId: number) {
        const product = await this.prisma.product.findUnique({ where: { id: productId }, include: { warehouse: true } });
        if (!product || !product.warehouse || product.warehouse.supplierId !== supplierId) {
            throw new UnauthorizedException('You do not own this product');
        }
        return await this.prisma.product.delete({ where: { id: productId } });
    }

    async searchWarehouseProducts(query: string) {
        return await this.prisma.product.findMany({
            where: {
                warehouseId: { not: null },
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { category: { is: { name: { contains: query, mode: 'insensitive' } } } },
                ],
            },
            include: { warehouse: true },
        });
    }
}