import { Injectable, UnauthorizedException, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateRoleDto } from './dto/role.dto';
import { RoleRequestDto } from './dto/role-request.dto';
import { CreateShopDto } from './dto/create-shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';
import { CreateShopProductDto } from './dto/create-shop-product.dto';
import { UpdateShopProductDto } from './dto/update-shop-product.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { CreateWarehouseProductDto } from './dto/create-warehouse-product.dto';
import { UpdateWarehouseProductDto } from './dto/update-warehouse-product.dto';
import { CreateWarehouseOrderDto } from './dto/create-warehouse-order.dto';
import { RequestWarehouseOrderDto } from './dto/request-warehouse-order.dto';

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService, // ✅ PrismaService Injected
        private readonly jwtService: JwtService, // ✅ JwtService Injected
    ) {
        console.log("✅ PrismaService initialized:", prisma);
    }

    // 🔒 Authentication Methods
    generateToken(user: any) {
        const payload = { sub: user.id, username: user.username, role: user.roleId };
        return this.jwtService.sign(payload, { secret: process.env.JWT_SECRET || 'a1b2c3d4e5f6g7h8i9j0kAdminDashboard!' });
    }

    async signup(dto: SignupDto) {
        console.log("✅ Signup endpoint hit \n Signup DTO received:", dto); // ✅ Debug log

        // Check if PrismaService is defined
        if (!this.prisma) {
            throw new Error("❌ PrismaService is not initialized");
        }

        const { username, email, phone, password } = dto;

        // Check if username exists
        const existingUser = await this.prisma.user.findUnique({ where: { username } });
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
        const { username, email, password } = dto;

        // Find user
        // const user = await this.prisma.user.findUnique({
        //     where: { username },
        // });

        // Find user with username or email
        const user = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { username: username || undefined },
                    { email: email || undefined },
                ],
            },
            include: { role: true },
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

    // 👤 User Management
    async createUser(dto: CreateUserDto) {
        const { username, email, phone, password, roleId } = dto;

        const existingUser = await this.prisma.user.findUnique({ where: { username } });
        if (existingUser) {
            throw new ConflictException('Username already exists');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const roleEntity = await this.prisma.role.findUnique({ where: { id: roleId } });
        if (!roleEntity) {
            throw new NotFoundException(`Role with ID ${roleId} not found`);
        }

        const user = await this.prisma.user.create({
            data: {
                username,
                email,
                phone,
                password: hashedPassword,
                roleId,
            },
        });

        return { user: { id: user.id, username: user.username, role: user.roleId } };
    }

    async updateUser(userId: number, dto: UpdateUserDto) {
        const { username, email, phone, password, profilePicture } = dto;

        // Check if username is taken (if provided)
        if (username) {
            const existingUser = await this.prisma.user.findUnique({ where: { username } });
            if (existingUser && existingUser.id !== userId) {
                throw new ConflictException('Username already exists');
            }
        }

        // Hash password if provided
        const updateData: any = { username, email, phone, profilePicture };
        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const user = await this.prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                username: true,
                email: true,
                phone: true,
                profilePicture: true,
                profile: true, // Include profile relation
            },
        });

        return { user: { id: user.id, username: user.username, email: user.email, phone: user.phone, profilePicture: user.profilePicture } };
    }

    async getUsers() {
        return await this.prisma.user.findMany({
            include: { role: true },
        });
    }

    async getUser(id: number) {
        return await this.prisma.user.findUnique({
            where: { id },
            include: {
                role: true,
                profile: true,
                shops: true,
                warehouse: true,
                orders: true,
                notifications: true,
                retailerConnections: true,
                supplierConnections: true,
                courierConnections: true,
                soldShops: true,
                boughtShops: true,
                roleRequest: true,
                carts: true,
                wishlists: true,
            },
        });
    }

    // 🛠️ Role Management
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

        const existingRequest = await this.prisma.roleRequest.findFirst({
            where: { userId, status: 'PENDING', requestedRole },
        });
        if (existingRequest) {
            throw new ConflictException('Pending request already exists for this role');
        }
        
        // Verify user exists before creating request
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException('User not found');
        }

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
                where: { status: 'PENDING' },
                include: { user: true },
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

    // 🏪 Shop Management
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
            include: { owner: true },
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

    // 📦 Product Management
    async getAllProducts() {
        return await this.prisma.product.findMany({ include: { shop: true } });
    }

    async createShopProduct(createShopProductDto: CreateShopProductDto, userId: number) {
        const shop = await this.prisma.shop.findUnique({
            where: { id: createShopProductDto.shopId },
            select: { id: true, ownerId: true, status: true }, // Explicitly select status
        })
        if (!shop || shop.ownerId !== userId) {
            throw new UnauthorizedException('You don not own this shop');
        }
        if (shop.status !== 'APPROVED') {
            throw new BadRequestException('Shop must be approved to add products');
        }
        return await this.prisma.product.create({
            data: {
                name: createShopProductDto.name,
                description: createShopProductDto.description,
                price: createShopProductDto.price,
                stock: createShopProductDto.stock,
                shopId: createShopProductDto.shopId,
            },
        });
    }

    async updateShopProduct(id: number, updateShopProductDto: UpdateShopProductDto, userId: number) {
        const product = await this.prisma.product.findUnique({ where: { id }, include: { shop: true } });
        if (!product || !product.shop || product.shop.ownerId !== userId) {
            throw new UnauthorizedException('You do not own this product');
        }
        return await this.prisma.product.update({
            where: { id },
            data: {
                name: updateShopProductDto.name,
                description: updateShopProductDto.description,
                price: updateShopProductDto.price,
                stock: updateShopProductDto.stock,
            },
        });
    }

    async deleteShopProduct(id: number, userId: number) {
        const product = await this.prisma.product.findUnique({ where: { id }, include: { shop: true } });
        if (!product || !product.shop || product.shop.ownerId !== userId) {
            throw new UnauthorizedException('You do not own this product');
        }
        return await this.prisma.product.delete({ where: { id } });
    }

    async getShopProducts(shopId: number, userId: number) {
        const shop = await this.prisma.shop.findUnique({ where: { id: shopId } });
        if (!shop || shop.ownerId !== userId) {
            throw new UnauthorizedException('You do not own this shop');
        }
        return await this.prisma.product.findMany({ where: { shopId } });
    }

    async getLowStockProducts() {
        return await this.prisma.product.findMany({
            where: { stock: { lte: 10 } },
            include: { shop: true },
        });
    }

    async searchProducts(query: string) {
        return await this.prisma.product.findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { category: { is: { name: { contains: query, mode: 'insensitive' } } } },
                ],
            },
            include: { shop: true },
        });
    }

    // 🗂️ Category Management
    async getCategories() {
        return await this.prisma.category.findMany();
    }

    async createCategory(createCategoryDto: CreateCategoryDto) {
        const { name } = createCategoryDto;
        const existingCategory = await this.prisma.category.findUnique({ where: { name } });
        if (existingCategory) {
            throw new ConflictException('Category already exists');
        }
        return await this.prisma.category.create({
            data: { name },
        });
    }

    async deleteCategory(id: number) {
        const category = await this.prisma.category.findUnique({ where: { id } });
        if (!category) {
            throw new NotFoundException('Category not found');
        }
        return await this.prisma.category.delete({ where: { id } });
    }

    // 📜 Order Management
    async createOrder(createOrderDto: CreateOrderDto, userId: number) {
        const product = await this.prisma.product.findUnique({
            where: { id: createOrderDto.productId },
            include: { shop: true, warehouse: true }, // Include both relations
        });
        if (!product || product.stock < createOrderDto.quantity) {
            throw new BadRequestException('Product not available or insufficient stock');
        }
        if (!product.shop) {
            throw new BadRequestException('Orders can only be placed for shop products');
        }
        if (product.shop.status !== 'APPROVED') {
            throw new BadRequestException('Shop is not approved');
        }

        const total = product.price * createOrderDto.quantity;
        const order = await this.prisma.order.create({
            data: {
                userId,
                productId: createOrderDto.productId,
                quantity: createOrderDto.quantity,
                shopId: product.shopId!, // Non-null assertion since we checked shop exists
                total,
                status: 'PENDING',
            },
        });

        await this.prisma.product.update({
            where: { id: createOrderDto.productId },
            data: { stock: product.stock - createOrderDto.quantity },
        });

        await this.createNotification(userId, `Order #${order.id} placed successfully!`, 'ORDER_PLACED');
        await this.createNotification(
            product.shop.ownerId,
            `New order #${order.id} received!`,
            'ORDER_RECEIVED',
        );

        return order;
    }

    async createWarehouseOrder(createWarehouseOrderDto: CreateWarehouseOrderDto, userId: number, shopId?: number) {
        const product = await this.prisma.product.findUnique({
            where: { id: createWarehouseOrderDto.productId },
            include: { warehouse: true },
        });
        if (!product || product.stock < createWarehouseOrderDto.quantity) {
            throw new BadRequestException('Product not available or insufficient stock');
        }
        if (!product.warehouse) {
            throw new UnauthorizedException('Product is not a warehouse product');
        }

        const total = product.price * createWarehouseOrderDto.quantity;
        const order = await this.prisma.order.create({
            data: {
                userId, // Can be a customer or shop owner
                productId: createWarehouseOrderDto.productId,
                quantity: createWarehouseOrderDto.quantity,
                shopId, // Optional, set if shop owner places the order
                total,
                status: shopId ? 'PENDING' : 'PROCESSING', // PENDING for shop requests, PROCESSING for customer orders
            },
        });

        await this.prisma.product.update({
            where: { id: createWarehouseOrderDto.productId },
            data: { stock: product.stock - createWarehouseOrderDto.quantity },
        });

        if (shopId) {
            await this.createNotification(userId, `Warehouse order #${order.id} requested successfully!`, 'WAREHOUSE_ORDER_REQUESTED');
            await this.createNotification(
                product.warehouse.supplierId,
                `New warehouse order request #${order.id} from shop ${shopId}!`,
                'WAREHOUSE_ORDER_REQUEST_RECEIVED',
            );
        } else {
            await this.createNotification(userId, `Warehouse order #${order.id} placed successfully!`, 'WAREHOUSE_ORDER_PLACED');
        }

        return order;
    }

    async requestWarehouseOrder(requestWarehouseOrderDto: RequestWarehouseOrderDto, userId: number) {
        const product = await this.prisma.product.findUnique({
            where: { id: requestWarehouseOrderDto.productId },
            include: { warehouse: true },
        });
        if (!product || product.stock < requestWarehouseOrderDto.quantity) {
            throw new BadRequestException('Product not available or insufficient stock');
        }
        if (!product.warehouse) {
            throw new UnauthorizedException('Product is not a warehouse product');
        }

        const order = await this.prisma.order.create({
            data: {
                userId,
                productId: requestWarehouseOrderDto.productId,
                quantity: requestWarehouseOrderDto.quantity,
                shopId: requestWarehouseOrderDto.shopId, // Set for shop owners, null for customers
                total: product.price * requestWarehouseOrderDto.quantity,
                status: 'REQUESTED', // New status for pending approval
            },
        });

        await this.createNotification(
            product.warehouse.supplierId,
            `New warehouse order request #${order.id} from ${requestWarehouseOrderDto.shopId ? 'shop' : 'customer'}!`,
            'WAREHOUSE_ORDER_REQUEST_RECEIVED',
        );
        await this.createNotification(userId, `Warehouse order request #${order.id} submitted!`, 'WAREHOUSE_ORDER_REQUEST_SUBMITTED');

        return order;
    }

    async getUserOrders(userId: number) {
        return await this.prisma.order.findMany({
            where: { userId },
            include: { product: true },
        });
    }

    async getAllOrders() {
        return await this.prisma.order.findMany({
            include: { product: true, user: true },
        });
    }

    async updateOrderStatus(orderId: number, status: string) {
        const order = await this.prisma.order.findUnique({ where: { id: orderId } });
        if (!order) {
            throw new NotFoundException('Order not found');
        }

        const validStatuses = ['REQUESTED', 'PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
        if (!validStatuses.includes(status)) {
            throw new BadRequestException('Invalid status');
        }

        if (order.status === 'REQUESTED' && status === 'PENDING') {
            const product = await this.prisma.product.findUnique({ where: { id: order.productId } });
            if (!product || product.stock < order.quantity) {
                throw new BadRequestException('Insufficient stock to approve order');
            }
            await this.prisma.product.update({
                where: { id: order.productId },
                data: { stock: product.stock - order.quantity },
            });
        }

        return await this.prisma.order.update({
            where: { id: orderId },
            data: { status },
        });
    }

    // 🛒 Cart and Wishlist
    async getCart(userId: number) {
        return await this.prisma.cart.findMany({ where: { userId }, include: { product: true } });
    }

    async addToCart(userId: number, productId: number) {
        return await this.prisma.cart.create({ data: { userId, productId, quantity: 1 } });
    }

    async removeFromCart(userId: number, productId: number) {
        return await this.prisma.cart.delete({ where: { userId_productId: { userId, productId } } });
    }

    async getWishlist(userId: number) {
        return await this.prisma.wishlist.findMany({ where: { userId }, include: { product: true } });
    }

    async addToWishlist(userId: number, productId: number) {
        return await this.prisma.wishlist.create({ data: { userId, productId } });
    }

    async removeFromWishlist(userId: number, productId: number) {
        return await this.prisma.wishlist.delete({ where: { userId_productId: { userId, productId } } });
    }

    // 🏬 Warehouse Management
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

    // 🚚 Courier
    async getAssignedOrders(userId: number) {
        return await this.prisma.order.findMany({
            where: { status: 'PROCESSING', shop: { connections: { some: { courierId: userId } } } },
            include: { product: true, shop: true },
        });
    }

    // 🔔 Notification Management
    async createNotification(userId: number, message: string, type: string) {
        return await this.prisma.notification.create({
            data: {
                userId,
                message,
                type,
            },
        });
    }

    async getUserNotifications(userId: number) {
        return await this.prisma.notification.findMany({ where: { userId } });
    }
}