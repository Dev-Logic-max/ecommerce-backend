import { Controller, Post, Body, ValidationPipe, UseGuards, Request, Get, UnauthorizedException, Patch, Param, Delete, Query, Put, InternalServerErrorException, MaxFileSizeValidator, ParseFilePipe, UploadedFile, UseInterceptors } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { UpdateUserDto } from '../user/dto/update-user.dto';
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
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { FileInterceptor } from '@nestjs/platform-express';

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

    @Patch('change-password') // 🌐 Route: /auth/change-password (Authenticated)
    @UseGuards(JwtAuthGuard)
    async changePassword(@Request() req, @Body() dto: ChangePasswordDto) {
        const userId = req.user.userId; // Assuming JWT payload has sub as userId
        return this.authService.changePassword(userId, dto);
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
    @Patch('update-user') // 🌐 Route: /auth/update (Authenticated)
    async update(@Request() req, @Body(ValidationPipe) dto: UpdateUserDto) {
        const userId = req.user.userId; // Get user ID from JWT token
        return this.authService.updateUser(userId, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Patch('upload-avatar')
    @UseInterceptors(
        FileInterceptor('profilePicture', {
            limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
        }),
    )
    async uploadAvatar(
        @UploadedFile(
            new ParseFilePipe({
                validators: [new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 })],
                fileIsRequired: false,
            }),
        )
        file: Express.Multer.File,
        @Request() req,
    ) {
        const userId = req.user.userId;
        return this.authService.uploadAvatar(userId, file); // Pass file directly
    }

    @Get('developer-users')
    @UseGuards(JwtAuthGuard)
    async getDeveloperUsers(@Request() req) {
        if (req.user.role !== 1)
            throw new UnauthorizedException('Only Developer can view Developer users');
        return this.authService.getDeveloperUsers();
    }

    @Get('developer-user/:id')
    @UseGuards(JwtAuthGuard)
    async getDeveloperUser(@Param('id') id: string, @Request() req) {
        if (req.user.role !== 1)
            throw new UnauthorizedException('Only Developer can view Developer user profile');
        return this.authService.getDeveloperUser(parseInt(id));
    }

    @Get('users')
    @UseGuards(JwtAuthGuard)
    async getUsers(@Request() req) {
        if (req.user.role !== 1 && req.user.role !== 2 && req.user.role !== 3)
            throw new UnauthorizedException('Only Developer, Platform Admin and Operations Admin can view users');
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
            console.log('Request user for getting roles:', req.user); // Debug the received user object
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
        return this.authService.getUserRoleRequests(req.user.userId);
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
        return this.authService.createShop(req.user.userId, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Patch('update-shop/:id') // 🌐 Route: /auth/update-shop/:id (Authenticated)
    async updateShop(@Request() req, @Param('id') id: string, @Body(ValidationPipe) dto: UpdateShopDto) {
        return this.authService.updateShop(req.user.userId, parseInt(id), dto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete('delete-shop/:id') // 🌐 Route: /auth/delete-shop/:id (Authenticated)
    async deleteShop(@Request() req, @Param('id') id: string) {
        return this.authService.deleteShop(req.user.userId, parseInt(id));
    }

    @UseGuards(JwtAuthGuard)
    @Get('shops') // 🌐 Route: /auth/shops (Authenticated)
    async getUserShops(@Request() req) {
        return this.authService.getUserShops(req.user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @Get('shops/pending') // 🌐 Route: /auth/shops/pending (Authenticated)
    async getPendingShops(@Request() req) {
        try {
            if (req.user.role === 1 || req.user.role === 2) {
                return this.authService.getPendingShops();
            } else {
                throw new UnauthorizedException('Only Developer and platform admins can view pending shops');
            }
        } catch (error) {
            throw new InternalServerErrorException('Failed to fetch pending shop requests');
        }
    }

    @UseGuards(JwtAuthGuard)
    @Put('shops/:id/approve') // 🌐 Route: /auth/shops/:id/approve (Authenticated)
    async approveShop(@Param('id') id: string, @Request() req) {
        if (req.user.role === 1 || req.user.role === 2) {
            return this.authService.approveShop(parseInt(id));
        } else {
            throw new UnauthorizedException('Only Developer and platform admins can approve shops');
        }
    }

    @UseGuards(JwtAuthGuard)
    @Put('shops/:id/reject') // 🌐 Route: /auth/shops/:id/reject (Authenticated)
    async rejectShop(@Param('id') id: string, @Request() req) {
        if (req.user.role === 1 || req.user.role === 2) {
            return this.authService.rejectShop(parseInt(id));
        } else {
            throw new UnauthorizedException('Only Developer and platform admins can reject shops');
        }
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
        return this.authService.createShopProduct(createShopProductDto, req.user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @Put('shop-products/:id') // 🌐 Route: /auth/products/:id (Authenticated)
    async updateShopProduct(
        @Param('id') id: string,
        @Body(ValidationPipe) updateShopProductDto: UpdateShopProductDto,
        @Request() req,
    ) {
        return this.authService.updateShopProduct(parseInt(id), updateShopProductDto, req.user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @Delete('shop-products/:id') // 🌐 Route: /auth/products/:id (Authenticated)
    async deleteShopProduct(@Param('id') id: string, @Request() req) {
        return this.authService.deleteShopProduct(parseInt(id), req.user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @Get('shops/:shopId/products') // 🌐 Route: /auth/shops/:shopId/products (Authenticated)
    async getShopProducts(@Param('shopId') shopId: string, @Request() req) {
        return this.authService.getShopProducts(parseInt(shopId), req.user.userId);
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
        if (req.user.role !== 1 && req.user.role !== 2) {
            throw new UnauthorizedException('Only developer and platform admins can create categories');
        }
        return this.authService.createCategory(createCategoryDto, req.user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @Put('categories/:id') // 🌐 Route: /auth/categories/:id (Authenticated)
    async updateCategory(@Param('id') id: string, @Body(ValidationPipe) updateCategoryDto: UpdateCategoryDto, @Request() req) {
        if (req.user.role !== 1 && req.user.role !== 2) {
            throw new UnauthorizedException('Only developer and platform admins can update categories');
        }
        return this.authService.updateCategory(parseInt(id), updateCategoryDto, req.user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @Delete('categories/:id') // 🌐 Route: /auth/categories/:id (Authenticated)
    async deleteCategory(@Param('id') id: string, @Request() req) {
        if (req.user.role !== 1 && req.user.role !== 2) {
            throw new UnauthorizedException('Only developer and platform admins can delete categories');
        }
        return this.authService.deleteCategory(parseInt(id));
    }

    // 📜 Order Management
    @UseGuards(JwtAuthGuard)
    @Post('orders') // 🌐 Route: /auth/orders (Authenticated)
    async createOrder(@Body(ValidationPipe) createOrderDto: CreateOrderDto, @Request() req) {
        return this.authService.createOrder(createOrderDto, req.user.userId);
    }

    @Post('warehouse-orders')
    @UseGuards(JwtAuthGuard)
    async createWarehouseOrder(
        @Body(ValidationPipe) createWarehouseOrderDto: CreateWarehouseOrderDto,
        @Request() req
    ) {
        if (req.user.role === 6) {
            // Supplier can fulfill orders (no shopId needed)
            return this.authService.createWarehouseOrder(createWarehouseOrderDto, req.user.userId);
        } else if (req.user.role === 4 || req.user.role === 5) { // Retailer or Merchant
            // Shop owner requesting an order
            return this.authService.createWarehouseOrder(createWarehouseOrderDto, req.user.userId, createWarehouseOrderDto.shopId);
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
        return this.authService.requestWarehouseOrder(requestWarehouseOrderDto, req.user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @Get('orders') // 🌐 Route: /auth/orders (Authenticated)
    async getUserOrders(@Request() req) {
        return this.authService.getUserOrders(req.user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @Get('orders/admin') // 🌐 Route: /auth/orders/shop (Authenticated)
    async getAdminOrders(@Request() req) {
        return this.authService.getAdminOrders(req.user.userId);
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
        return this.authService.getCart(req.user.userId);
    }

    @Post('cart/:productId')
    @UseGuards(JwtAuthGuard)
    async addToCart(@Param('productId') productId: string, @Request() req) {
        return this.authService.addToCart(req.user.userId, parseInt(productId));
    }

    @Delete('cart/:productId')
    @UseGuards(JwtAuthGuard)
    async removeFromCart(@Param('productId') productId: string, @Request() req) {
        return this.authService.removeFromCart(req.user.userId, parseInt(productId));
    }

    @Get('wishlist')
    @UseGuards(JwtAuthGuard)
    async getWishlist(@Request() req) {
        return this.authService.getWishlist(req.user.userId);
    }

    @Post('wishlist/:productId')
    @UseGuards(JwtAuthGuard)
    async addToWishlist(@Param('productId') productId: string, @Request() req) {
        return this.authService.addToWishlist(req.user.userId, parseInt(productId));
    }

    @Delete('wishlist/:productId')
    @UseGuards(JwtAuthGuard)
    async removeFromWishlist(@Param('productId') productId: string, @Request() req) {
        return this.authService.removeFromWishlist(req.user.userId, parseInt(productId));
    }

    // 🏬 Warehouse Management
    @Post('warehouse')
    @UseGuards(JwtAuthGuard)
    async createWarehouse(@Request() req, @Body() dto: CreateWarehouseDto) {
        if (req.user.role !== 6) throw new UnauthorizedException('Only Supplier can create a warehouse');
        return this.authService.createWarehouse(req.user.userId, dto);
    }

    @Put('warehouse')
    @UseGuards(JwtAuthGuard)
    async updateWarehouse(@Request() req, @Body() data: { name?: string; location?: string }) {
        return this.authService.updateWarehouse(req.user.userId, data);
    }

    @Delete('warehouse')
    @UseGuards(JwtAuthGuard)
    async deleteWarehouse(@Request() req) {
        if (req.user.role !== 6) throw new UnauthorizedException('Only Supplier can delete a warehouse');
        return this.authService.deleteWarehouse(req.user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @Get('warehouses/pending') // 🌐 Route: /auth/warehouses/pending (Authenticated)
    async getPendingWarehouses(@Request() req) {
        if (req.user.role === 1 || req.user.role === 2) {
            return this.authService.getPendingWarehouses();
        } else {
            throw new UnauthorizedException('Only Developer and Platform Admins can view pending warehouses');
        }
    }

    @Put('warehouses/:id/approve') // 🌐 Route: /auth/warehouses/:id/approve (Authenticated)
    async approveWarehouse(@Param('id') id: string, @Request() req) {
        if (req.user.role === 1 || req.user.role === 2) {
            return this.authService.approveWarehouse(parseInt(id));
        } else {
            throw new UnauthorizedException('Only Developer and Platform Admins can approve warehouses');
        }
    }

    @Put('warehouses/:id/reject') // 🌐 Route: /auth/warehouses/:id/reject (Authenticated)
    async rejectWarehouse(@Param('id') id: string, @Request() req) {
        if (req.user.role === 1 || req.user.role === 2) {
            return this.authService.rejectWarehouse(parseInt(id));
        } else {
            throw new UnauthorizedException('Only Developer and Platform Admins can reject warehouses');
        }
    }

    @Get('warehouse')
    @UseGuards(JwtAuthGuard)
    async getWarehouse(@Request() req) {
        return this.authService.getWarehouse(req.user.userId);
    }

    @Get('warehouse-products')
    @UseGuards(JwtAuthGuard)
    async getWarehouseProducts(@Request() req) {
        if (req.user.role !== 6) throw new UnauthorizedException('Only Supplier can view warehouse products');
        return this.authService.getWarehouseProducts(req.user.userId);
    }

    @Post('warehouse-products')
    @UseGuards(JwtAuthGuard)
    async createWarehouseProduct(@Request() req, @Body(ValidationPipe) data: CreateWarehouseProductDto) {
        if (req.user.role !== 6) throw new UnauthorizedException('Only Supplier can create warehouse products');
        return this.authService.createWarehouseProduct(req.user.userId, data);
    }

    @Put('warehouse-products/:id')
    @UseGuards(JwtAuthGuard)
    async updateWarehouseProduct(@Param('id') id: string, @Request() req, @Body(ValidationPipe) data: UpdateWarehouseProductDto) {
        if (req.user.role !== 6) throw new UnauthorizedException('Only Supplier can update warehouse products');
        return this.authService.updateWarehouseProduct(parseInt(id), req.user.userId, data);
    }

    @Delete('warehouse-products/:id')
    @UseGuards(JwtAuthGuard)
    async deleteWarehouseProduct(@Param('id') id: string, @Request() req) {
        if (req.user.role !== 6) throw new UnauthorizedException('Only Supplier can delete warehouse products');
        return this.authService.deleteWarehouseProduct(parseInt(id), req.user.userId);
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
        return this.authService.getAssignedOrders(req.user.userId);
    }

    // 🔔 Notification Management
    @UseGuards(JwtAuthGuard)
    @Get('notifications') // 🌐 Route: /auth/notifications (Authenticated)
    async getUserNotifications(@Request() req) {
        return this.authService.getUserNotifications(req.user.userId);
    }
}