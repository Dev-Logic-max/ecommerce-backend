import { Controller, Post, Body, ValidationPipe, UseGuards, Request, Get, UnauthorizedException, Patch, Param, Delete, Query, Put, InternalServerErrorException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateRoleDto } from './dto/role.dto';
import { RoleRequestDto } from './dto/role-request.dto';
import { CreateShopDto } from './dto/create-shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';
import { CreateShopProductDto } from './dto/create-shop-product.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateShopProductDto } from './dto/update-shop-product.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { CreateWarehouseProductDto } from './dto/create-warehouse-product.dto';
import { UpdateWarehouseProductDto } from './dto/update-warehouse-product.dto';
import { CreateWarehouseOrderDto } from './dto/create-warehouse-order.dto';
import { RequestWarehouseOrderDto } from './dto/request-warehouse-order.dto';

@Controller('auth') // 🌐 Base route: /auth
export class AuthController {
    constructor(private authService: AuthService) { }

    // 🔒 Authentication Endpoints
    @Post('signup') // 🌐 Route: /auth/signup
    async signup(@Body(ValidationPipe) dto: SignupDto) {
        return this.authService.signup(dto);
    }

    @Post('login') // 🌐 Route: /auth/login
    async login(@Body(ValidationPipe) dto: LoginDto) {
        return this.authService.login(dto);
    }

    @UseGuards(JwtAuthGuard)
    @Get('verify') // 🌐 Route: /auth/verify (Authenticated)
    async verify(@Request() req) {
        return { message: 'Token is valid', user: req.user };
    }

    // 👤 User Management
    @UseGuards(JwtAuthGuard)
    @Post('create-user') // 🌐 Route: /auth/create-user (Authenticated)
    async createUser(@Body(ValidationPipe) dto: CreateUserDto, @Request() req) {
        if (req.user.role !== 1) {
            throw new UnauthorizedException('Only developers can create users');
        }
        return this.authService.createUser(dto);
    }

    @UseGuards(JwtAuthGuard)
    @Patch('update') // 🌐 Route: /auth/update (Authenticated)
    async update(@Request() req, @Body(ValidationPipe) dto: UpdateUserDto) {
        const userId = req.user.sub; // Get user ID from JWT token
        return this.authService.updateUser(userId, dto);
    }

    @Get('users')
    @UseGuards(JwtAuthGuard)
    async getUsers(@Request() req) {
        if (req.user.role !== 1) throw new UnauthorizedException('Only Developer can view users');
        return this.authService.getUsers();
    }

    @Get('user/:id')
    @UseGuards(JwtAuthGuard)
    async getUser(@Param('id') id: string, @Request() req) {
        if (req.user.role !== 1) throw new UnauthorizedException('Only Developer can view user details');
        return this.authService.getUser(parseInt(id));
    }

    // 🛠️ Role Management
    @UseGuards(JwtAuthGuard)
    @Post('create-role') // 🌐 Route: /auth/create-role (Authenticated)
    async createRole(@Body(ValidationPipe) dto: CreateRoleDto, @Request() req) {
        const userRole = req.user.role; // Role ID from token
        const allowedRoles = [1, 2]; // Developer, PlatformAdmin
        if (!allowedRoles.includes(userRole)) {
            throw new UnauthorizedException('Only Developer or PlatformAdmin can create roles');
        }
        return this.authService.createRole(dto);
    }

    @UseGuards(JwtAuthGuard)
    @Post('role-request') // 🌐 Route: /auth/role-request (Authenticated)
    async requestRole(@Request() req, @Body(ValidationPipe) dto: RoleRequestDto) {
        return this.authService.requestRole(req.user.userId, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Get('role-requests') // 🌐 Route: /auth/role-requests (Authenticated)
    async getRoleRequests(@Request() req) {
        try {
            console.log('Request user:', req.user); // Debug the received user object
            return this.authService.getRoleRequests(req.user.userId);
        } catch (error) {
            console.log('User from token during error:', req.user);
            if (error instanceof UnauthorizedException) throw error;
            throw new InternalServerErrorException('Failed to fetch role requests');
        }
    }

    @UseGuards(JwtAuthGuard)
    @Get('role-requests/user') // 🌐 Route: /auth/role-requests/user (Authenticated)
    async getUserRoleRequests(@Request() req) {
        return this.authService.getUserRoleRequests(req.user.sub);
    }

    @UseGuards(JwtAuthGuard)
    @Post('role/approve/:id') // 🌐 Route: /auth/role/approve/:id (Authenticated)
    async approveRoleRequest(@Param('id') id: string, @Request() req) {
        return this.authService.approveRoleRequest(parseInt(id), req.user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @Post('role/reject/:id') // 🌐 Route: /auth/role/reject/:id (Authenticated)
    async rejectRoleRequest(@Param('id') id: string, @Request() req) {
        return this.authService.rejectRoleRequest(parseInt(id), req.user.userId);
    }

    // 🏪 Shop Management
    @UseGuards(JwtAuthGuard)
    @Post('create-shop') // 🌐 Route: /auth/create-shop (Authenticated)
    async createShop(@Request() req, @Body(ValidationPipe) dto: CreateShopDto) {
        return this.authService.createShop(req.user.sub, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Patch('update-shop/:id') // 🌐 Route: /auth/update-shop/:id (Authenticated)
    async updateShop(@Request() req, @Param('id') id: string, @Body(ValidationPipe) dto: UpdateShopDto) {
        return this.authService.updateShop(req.user.sub, parseInt(id), dto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete('delete-shop/:id') // 🌐 Route: /auth/delete-shop/:id (Authenticated)
    async deleteShop(@Request() req, @Param('id') id: string) {
        return this.authService.deleteShop(req.user.sub, parseInt(id));
    }

    @UseGuards(JwtAuthGuard)
    @Get('shops') // 🌐 Route: /auth/shops (Authenticated)
    async getUserShops(@Request() req) {
        return this.authService.getUserShops(req.user.sub);
    }

    @UseGuards(JwtAuthGuard)
    @Get('shops/pending') // 🌐 Route: /auth/shops/pending (Authenticated)
    async getPendingShops(@Request() req) {
        if (req.user.role !== 2) {
            throw new UnauthorizedException('Only platform admins can view pending shops');
        }
        return this.authService.getPendingShops();
    }

    @UseGuards(JwtAuthGuard)
    @Put('shops/:id/approve') // 🌐 Route: /auth/shops/:id/approve (Authenticated)
    async approveShop(@Param('id') id: string, @Request() req) {
        if (req.user.role !== 2) {
            throw new UnauthorizedException('Only platform admins can approve shops');
        }
        return this.authService.approveShop(parseInt(id));
    }

    @UseGuards(JwtAuthGuard)
    @Put('shops/:id/reject') // 🌐 Route: /auth/shops/:id/reject (Authenticated)
    async rejectShop(@Param('id') id: string, @Request() req) {
        if (req.user.role !== 2) {
            throw new UnauthorizedException('Only platform admins can reject shops');
        }
        return this.authService.rejectShop(parseInt(id));
    }

    // 📦 Product Management
    @UseGuards(JwtAuthGuard)
    @Get('products') // 🌐 Route: /auth/products (Authenticated)
    async getAllProducts() {
        return this.authService.getAllProducts();
    }

    @UseGuards(JwtAuthGuard)
    @Post('shop-products') // 🌐 Route: /auth/products (Authenticated)
    async createShopProduct(@Body(ValidationPipe) createShopProductDto: CreateShopProductDto, @Request() req) {
        return this.authService.createShopProduct(createShopProductDto, req.user.sub);
    }

    @UseGuards(JwtAuthGuard)
    @Put('shop-products/:id') // 🌐 Route: /auth/products/:id (Authenticated)
    async updateShopProduct(
        @Param('id') id: string,
        @Body(ValidationPipe) updateShopProductDto: UpdateShopProductDto,
        @Request() req,
    ) {
        return this.authService.updateShopProduct(parseInt(id), updateShopProductDto, req.user.sub);
    }

    @UseGuards(JwtAuthGuard)
    @Delete('shop-products/:id') // 🌐 Route: /auth/products/:id (Authenticated)
    async deleteShopProduct(@Param('id') id: string, @Request() req) {
        return this.authService.deleteShopProduct(parseInt(id), req.user.sub);
    }

    @UseGuards(JwtAuthGuard)
    @Get('shops/:shopId/products') // 🌐 Route: /auth/shops/:shopId/products (Authenticated)
    async getShopProducts(@Param('shopId') shopId: string, @Request() req) {
        return this.authService.getShopProducts(parseInt(shopId), req.user.sub);
    }

    @UseGuards(JwtAuthGuard)
    @Get('products/low-stock') // 🌐 Route: /auth/products/low-stock (Authenticated)
    async getLowStockProducts(@Request() req) {
        if (req.user.role !== 3) {
            throw new UnauthorizedException('Only operations admins can view low stock products');
        }
        return this.authService.getLowStockProducts();
    }

    @UseGuards(JwtAuthGuard)
    @Get('search-products') // 🌐 Route: /auth/search-products (Authenticated)
    async searchProducts(@Query('q') query: string) {
        return this.authService.searchProducts(query);
    }

    // 🗂️ Category Management
    @UseGuards(JwtAuthGuard)
    @Get('categories') // 🌐 Route: /auth/categories (Authenticated)
    async getCategories() {
        return this.authService.getCategories();
    }

    @UseGuards(JwtAuthGuard)
    @Post('categories') // 🌐 Route: /auth/categories (Authenticated)
    async createCategory(@Body(ValidationPipe) createCategoryDto: CreateCategoryDto, @Request() req) {
        if (req.user.role !== 2) {
            throw new UnauthorizedException('Only platform admins can create categories');
        }
        return this.authService.createCategory(createCategoryDto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete('categories/:id') // 🌐 Route: /auth/categories/:id (Authenticated)
    async deleteCategory(@Param('id') id: string, @Request() req) {
        if (req.user.role !== 2) {
            throw new UnauthorizedException('Only platform admins can delete categories');
        }
        return this.authService.deleteCategory(parseInt(id));
    }

    // 📜 Order Management
    @UseGuards(JwtAuthGuard)
    @Post('orders') // 🌐 Route: /auth/orders (Authenticated)
    async createOrder(@Body(ValidationPipe) createOrderDto: CreateOrderDto, @Request() req) {
        return this.authService.createOrder(createOrderDto, req.user.sub);
    }

    @Post('warehouse-orders')
    @UseGuards(JwtAuthGuard)
    async createWarehouseOrder(
        @Body(ValidationPipe) createWarehouseOrderDto: CreateWarehouseOrderDto,
        @Request() req
    ) {
        if (req.user.role === 6) {
            // Supplier can fulfill orders (no shopId needed)
            return this.authService.createWarehouseOrder(createWarehouseOrderDto, req.user.sub);
        } else if (req.user.role === 4 || req.user.role === 5) { // Retailer or Merchant
            // Shop owner requesting an order
            return this.authService.createWarehouseOrder(createWarehouseOrderDto, req.user.sub, createWarehouseOrderDto.shopId);
        } else {
            throw new UnauthorizedException('Only Suppliers, Retailers, or Merchants can create warehouse orders');
        }
    }

    @Post('request-warehouse-order')
    @UseGuards(JwtAuthGuard)
    async requestWarehouseOrder(
        @Body(ValidationPipe) requestWarehouseOrderDto: RequestWarehouseOrderDto,
        @Request() req
    ) {
        return this.authService.requestWarehouseOrder(requestWarehouseOrderDto, req.user.sub);
    }

    @UseGuards(JwtAuthGuard)
    @Get('orders') // 🌐 Route: /auth/orders (Authenticated)
    async getUserOrders(@Request() req) {
        return this.authService.getUserOrders(req.user.sub);
    }

    @UseGuards(JwtAuthGuard)
    @Get('orders/all') // 🌐 Route: /auth/orders/all (Authenticated)
    async getAllOrders(@Request() req) {
        if (req.user.role !== 3) {
            throw new UnauthorizedException('Only operations admins can view all orders');
        }
        return this.authService.getAllOrders();
    }

    @UseGuards(JwtAuthGuard)
    @Put('orders/:id/status') // 🌐 Route: /auth/orders/:id/status (Authenticated)
    async updateOrderStatus(
        @Param('id') id: string,
        @Body('status') status: string,
        @Request() req,
    ) {
        if (req.user.role !== 3) {
            throw new UnauthorizedException('Only operations admins can update order status');
        }
        return this.authService.updateOrderStatus(parseInt(id), status);
    }

    // 🛒 Cart and Wishlist
    @Get('cart')
    @UseGuards(JwtAuthGuard)
    async getCart(@Request() req) {
        return this.authService.getCart(req.user.sub);
    }

    @Post('cart/:productId')
    @UseGuards(JwtAuthGuard)
    async addToCart(@Param('productId') productId: string, @Request() req) {
        return this.authService.addToCart(req.user.sub, parseInt(productId));
    }

    @Delete('cart/:productId')
    @UseGuards(JwtAuthGuard)
    async removeFromCart(@Param('productId') productId: string, @Request() req) {
        return this.authService.removeFromCart(req.user.sub, parseInt(productId));
    }

    @Get('wishlist')
    @UseGuards(JwtAuthGuard)
    async getWishlist(@Request() req) {
        return this.authService.getWishlist(req.user.sub);
    }

    @Post('wishlist/:productId')
    @UseGuards(JwtAuthGuard)
    async addToWishlist(@Param('productId') productId: string, @Request() req) {
        return this.authService.addToWishlist(req.user.sub, parseInt(productId));
    }

    @Delete('wishlist/:productId')
    @UseGuards(JwtAuthGuard)
    async removeFromWishlist(@Param('productId') productId: string, @Request() req) {
        return this.authService.removeFromWishlist(req.user.sub, parseInt(productId));
    }

    // 🏬 Warehouse Management
    @Post('warehouse')
    @UseGuards(JwtAuthGuard)
    async createWarehouse(@Request() req, @Body() dto: CreateWarehouseDto) {
        if (req.user.role !== 6) throw new UnauthorizedException('Only Supplier can create a warehouse');
        return this.authService.createWarehouse(req.user.sub, dto);
    }

    @Put('warehouse')
    @UseGuards(JwtAuthGuard)
    async updateWarehouse(@Request() req, @Body() data: { name?: string; location?: string }) {
        return this.authService.updateWarehouse(req.user.sub, data);
    }

    @Delete('warehouse')
    @UseGuards(JwtAuthGuard)
    async deleteWarehouse(@Request() req) {
        if (req.user.role !== 6) throw new UnauthorizedException('Only Supplier can delete a warehouse');
        return this.authService.deleteWarehouse(req.user.sub);
    }

    @Get('warehouse')
    @UseGuards(JwtAuthGuard)
    async getWarehouse(@Request() req) {
        return this.authService.getWarehouse(req.user.sub);
    }

    @Get('warehouse-products')
    @UseGuards(JwtAuthGuard)
    async getWarehouseProducts(@Request() req) {
        if (req.user.role !== 6) throw new UnauthorizedException('Only Supplier can view warehouse products');
        return this.authService.getWarehouseProducts(req.user.sub);
    }

    @Post('warehouse-products')
    @UseGuards(JwtAuthGuard)
    async createWarehouseProduct(@Request() req, @Body(ValidationPipe) data: CreateWarehouseProductDto) {
        if (req.user.role !== 6) throw new UnauthorizedException('Only Supplier can create warehouse products');
        return this.authService.createWarehouseProduct(req.user.sub, data);
    }

    @Put('warehouse-products/:id')
    @UseGuards(JwtAuthGuard)
    async updateWarehouseProduct(@Param('id') id: string, @Request() req, @Body(ValidationPipe) data: UpdateWarehouseProductDto) {
        if (req.user.role !== 6) throw new UnauthorizedException('Only Supplier can update warehouse products');
        return this.authService.updateWarehouseProduct(parseInt(id), req.user.sub, data);
    }

    @Delete('warehouse-products/:id')
    @UseGuards(JwtAuthGuard)
    async deleteWarehouseProduct(@Param('id') id: string, @Request() req) {
        if (req.user.role !== 6) throw new UnauthorizedException('Only Supplier can delete warehouse products');
        return this.authService.deleteWarehouseProduct(parseInt(id), req.user.sub);
    }

    @UseGuards(JwtAuthGuard)
    @Get('search-warehouse-products')
    async searchWarehouseProducts(@Query('q') query: string) {
        return this.authService.searchWarehouseProducts(query);
    }

    // 🚚 Courier
    @Get('orders/assigned')
    @UseGuards(JwtAuthGuard)
    async getAssignedOrders(@Request() req) {
        return this.authService.getAssignedOrders(req.user.sub);
    }

    // 🔔 Notification Management
    @UseGuards(JwtAuthGuard)
    @Get('notifications') // 🌐 Route: /auth/notifications (Authenticated)
    async getUserNotifications(@Request() req) {
        return this.authService.getUserNotifications(req.user.sub);
    }
}