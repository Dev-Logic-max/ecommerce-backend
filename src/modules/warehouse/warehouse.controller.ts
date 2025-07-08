import { Controller, Post, Body, ValidationPipe, UseGuards, Request, Get, UnauthorizedException, Param, Delete, Query, Put } from '@nestjs/common';
import { CreateWarehouseDto } from '../auth/dto/create-warehouse.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateWarehouseProductDto } from '../auth/dto/create-warehouse-product.dto';
import { UpdateWarehouseProductDto } from '../auth/dto/update-warehouse-product.dto';
import { WarehouseService } from './warehouse.service';

@Controller('warehouse') // 🌐 Base route: /warehouse
export class WarehouseController {
    constructor(private warehouseService: WarehouseService) { }

    // 🏬 Warehouse Management API endpoints

    @Post('warehouse')
    @UseGuards(JwtAuthGuard)
    async createWarehouse(@Request() req, @Body() dto: CreateWarehouseDto) {
        if (req.user.role !== 6) throw new UnauthorizedException('Only Supplier can create a warehouse');
        return this.warehouseService.createWarehouse(req.user.userId, dto);
    }

    @Put('warehouse')
    @UseGuards(JwtAuthGuard)
    async updateWarehouse(@Request() req, @Body() data: { name?: string; location?: string }) {
        return this.warehouseService.updateWarehouse(req.user.userId, data);
    }

    @Delete('warehouse')
    @UseGuards(JwtAuthGuard)
    async deleteWarehouse(@Request() req) {
        if (req.user.role !== 6) throw new UnauthorizedException('Only Supplier can delete a warehouse');
        return this.warehouseService.deleteWarehouse(req.user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @Get('warehouses/pending') // 🌐 Route: /warehouse/warehouses/pending (Authenticated)
    async getPendingWarehouses(@Request() req) {
        if (req.user.role === 1 || req.user.role === 2) {
            return this.warehouseService.getPendingWarehouses();
        } else {
            throw new UnauthorizedException('Only Developer and Platform Admins can view pending warehouses');
        }
    }

    @Put('warehouses/:id/approve') // 🌐 Route: /warehouse/warehouses/:id/approve (Authenticated)
    async approveWarehouse(@Param('id') id: string, @Request() req) {
        if (req.user.role === 1 || req.user.role === 2) {
            return this.warehouseService.approveWarehouse(parseInt(id));
        } else {
            throw new UnauthorizedException('Only Developer and Platform Admins can approve warehouses');
        }
    }

    @Put('warehouses/:id/reject') // 🌐 Route: /warehouse/warehouses/:id/reject (Authenticated)
    async rejectWarehouse(@Param('id') id: string, @Request() req) {
        if (req.user.role === 1 || req.user.role === 2) {
            return this.warehouseService.rejectWarehouse(parseInt(id));
        } else {
            throw new UnauthorizedException('Only Developer and Platform Admins can reject warehouses');
        }
    }

    @Get('warehouse')
    @UseGuards(JwtAuthGuard)
    async getWarehouse(@Request() req) {
        return this.warehouseService.getWarehouse(req.user.userId);
    }

    @Get('warehouse-products')
    @UseGuards(JwtAuthGuard)
    async getWarehouseProducts(@Request() req) {
        if (req.user.role !== 6) throw new UnauthorizedException('Only Supplier can view warehouse products');
        return this.warehouseService.getWarehouseProducts(req.user.userId);
    }

    @Post('warehouse-products')
    @UseGuards(JwtAuthGuard)
    async createWarehouseProduct(@Request() req, @Body(ValidationPipe) data: CreateWarehouseProductDto) {
        if (req.user.role !== 6) throw new UnauthorizedException('Only Supplier can create warehouse products');
        return this.warehouseService.createWarehouseProduct(req.user.userId, data);
    }

    @Put('warehouse-products/:id')
    @UseGuards(JwtAuthGuard)
    async updateWarehouseProduct(@Param('id') id: string, @Request() req, @Body(ValidationPipe) data: UpdateWarehouseProductDto) {
        if (req.user.role !== 6) throw new UnauthorizedException('Only Supplier can update warehouse products');
        return this.warehouseService.updateWarehouseProduct(parseInt(id), req.user.userId, data);
    }

    @Delete('warehouse-products/:id')
    @UseGuards(JwtAuthGuard)
    async deleteWarehouseProduct(@Param('id') id: string, @Request() req) {
        if (req.user.role !== 6) throw new UnauthorizedException('Only Supplier can delete warehouse products');
        return this.warehouseService.deleteWarehouseProduct(parseInt(id), req.user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @Get('search-warehouse-products')
    async searchWarehouseProducts(@Query('q') query: string) {
        return this.warehouseService.searchWarehouseProducts(query);
    }
}