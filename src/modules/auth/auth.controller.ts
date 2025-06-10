import { Controller, Post, Body, ValidationPipe, UseGuards, Request, Get, UnauthorizedException, Patch, Param, Delete, Query, Put } from '@nestjs/common';
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
import { CreateProductDto } from './dto/create-product.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateCategoryDto } from './dto/create-category.dto';

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
    @Post('role/request') // 🌐 Route: /auth/role/request (Authenticated)
    async requestRole(@Request() req, @Body(ValidationPipe) dto: RoleRequestDto) {
        return this.authService.requestRole(req.user.sub, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Get('role-requests') // 🌐 Route: /auth/role-requests (Authenticated)
    async getRoleRequests(@Request() req) {
        return this.authService.getRoleRequests(req.user.sub);
    }

    @UseGuards(JwtAuthGuard)
    @Get('role-requests/user') // 🌐 Route: /auth/role-requests/user (Authenticated)
    async getUserRoleRequests(@Request() req) {
        return this.authService.getUserRoleRequests(req.user.sub);
    }

    @UseGuards(JwtAuthGuard)
    @Post('role/approve/:id') // 🌐 Route: /auth/role/approve/:id (Authenticated)
    async approveRoleRequest(@Param('id') id: string, @Request() req) {
        return this.authService.approveRoleRequest(parseInt(id), req.user.sub);
    }

    @UseGuards(JwtAuthGuard)
    @Post('role/reject/:id') // 🌐 Route: /auth/role/reject/:id (Authenticated)
    async rejectRoleRequest(@Param('id') id: string, @Request() req) {
        return this.authService.rejectRoleRequest(parseInt(id), req.user.sub);
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

    @UseGuards(JwtAuthGuard)
    @Get('products') // 🌐 Route: /auth/products (Authenticated)
    async getAllProducts() {
        return this.authService.getAllProducts();
    }

    @UseGuards(JwtAuthGuard)
    @Post('products') // 🌐 Route: /auth/products (Authenticated)
    async createProduct(@Body(ValidationPipe) createProductDto: CreateProductDto, @Request() req) {
        return this.authService.createProduct(createProductDto, req.user.sub);
    }

    @UseGuards(JwtAuthGuard)
    @Put('products/:id') // 🌐 Route: /auth/products/:id (Authenticated)
    async updateProduct(
        @Param('id') id: string,
        @Body(ValidationPipe) updateProductDto: UpdateProductDto,
        @Request() req,
    ) {
        return this.authService.updateProduct(parseInt(id), updateProductDto, req.user.sub);
    }

    @UseGuards(JwtAuthGuard)
    @Delete('products/:id') // 🌐 Route: /auth/products/:id (Authenticated)
    async deleteProduct(@Param('id') id: string, @Request() req) {
        return this.authService.deleteProduct(parseInt(id), req.user.sub);
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