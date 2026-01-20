import { Controller, Post, Body, Patch, UseGuards, Param, Get, Request, UnauthorizedException, Delete, ValidationPipe, InternalServerErrorException, Put } from '@nestjs/common';
import { ShopService } from './shop.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateShopDto } from './dto/create-shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';

@Controller('shop')
export class ShopController {
    constructor(private readonly shopService: ShopService) { }

    // 🏪 Shop Management API endpoints

    @UseGuards(JwtAuthGuard)
    @Post('create-shop') // 🌐 Route: /shop/create-shop (Authenticated)
    async createShop(@Request() req, @Body(ValidationPipe) dto: CreateShopDto) {
        return this.shopService.createShop(req.user.userId, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Patch('update-shop/:id') // 🌐 Route: /shop/update-shop/:id (Authenticated)
    async updateShop(@Request() req, @Param('id') id: string, @Body(ValidationPipe) dto: UpdateShopDto) {
        return this.shopService.updateShop(req.user.userId, parseInt(id), dto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete('delete-shop/:id') // 🌐 Route: /shop/delete-shop/:id (Authenticated)
    async deleteShop(@Request() req, @Param('id') id: string) {
        return this.shopService.deleteShop(req.user.userId, parseInt(id));
    }

    @UseGuards(JwtAuthGuard)
    @Get('shops') // 🌐 Route: /shop/shops (Authenticated)
    async getUserShops(@Request() req) {
        return this.shopService.getUserShops(req.user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @Get('shops/pending') // 🌐 Route: /shop/shops/pending (Authenticated)
    async getPendingShops(@Request() req) {
        try {
            if (req.user.role === 1 || req.user.role === 2) {
                return this.shopService.getPendingShops();
            } else {
                throw new UnauthorizedException('Only Developer and platform admins can view pending shops');
            }
        } catch (error) {
            throw new InternalServerErrorException('Failed to fetch pending shop requests');
        }
    }

    @UseGuards(JwtAuthGuard)
    @Put('shops/:id/approve') // 🌐 Route: /shop/shops/:id/approve (Authenticated)
    async approveShop(@Param('id') id: string, @Request() req) {
        if (req.user.role === 1 || req.user.role === 2) {
            return this.shopService.approveShop(parseInt(id));
        } else {
            throw new UnauthorizedException('Only Developer and platform admins can approve shops');
        }
    }

    @UseGuards(JwtAuthGuard)
    @Put('shops/:id/reject') // 🌐 Route: /shop/shops/:id/reject (Authenticated)
    async rejectShop(@Param('id') id: string, @Request() req) {
        if (req.user.role === 1 || req.user.role === 2) {
            return this.shopService.rejectShop(parseInt(id));
        } else {
            throw new UnauthorizedException('Only Developer and platform admins can reject shops');
        }
    }
}