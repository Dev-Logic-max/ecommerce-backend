import { Injectable, UnauthorizedException, ConflictException, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { config } from 'dotenv';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { UpdateUserDto } from '../user/dto/update-user.dto';
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
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

config(); // Load .env

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

        const { username, email, phone, password, profile } = dto;

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
            include: { profile: true }, // Include profile to return null if not created
        });

        // Create profile if provided
        if (profile) {
            const profileData = {
                userId: user.id,
                name: profile.name,
                address: profile.address,
                city: profile.city,
                country: profile.country,
            };
            const filteredProfileData = Object.fromEntries(
                Object.entries(profileData).filter(([_, value]) => value !== undefined && value !== null)
            );
            if (Object.keys(filteredProfileData).length > 0) {
                await this.prisma.profile.create({
                    data: {
                        user: { connect: { id: user.id } }, // Connect to the created user
                        ...filteredProfileData, // Add other profile fields
                    },
                });
            }
        }

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

    async changePassword(userId: number, dto: ChangePasswordDto) {
        const { currentPassword, newPassword } = dto;

        // Find the user
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Verify current password
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid current password');
        }

        // Hash and update new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await this.prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });

        return { message: 'Password updated successfully' };
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

    async getDeveloperUsers() {
        return await this.prisma.user.findMany({
            where: { roleId: { in: [1] } },
            include: { role: true }
        })
    }

    async getDeveloperUser(id: number) {
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

    async updateUser(userId: number, dto: UpdateUserDto) {
        const { username, email, phone, profile } = dto;

        // Check if username is taken (if provided)
        if (username) {
            const existingUser = await this.prisma.user.findUnique({ where: { username } });
            if (existingUser && existingUser.id !== userId) {
                throw new ConflictException('Username already exists');
            }
        }

        const updateData: any = { username, email, phone };

        // Handle profile data
        if (profile) {
            const existingProfile = await this.prisma.profile.findUnique({ where: { userId } });
            const profileData = {
                name: profile.name,
                address: profile.address,
                city: profile.city,
                country: profile.country,
            };

            // Filter out undefined or null values
            const filteredProfileData = Object.fromEntries(
                Object.entries(profileData).filter(([_, value]) => value !== undefined && value !== null)
            );

            if (Object.keys(filteredProfileData).length > 0) {
                if (existingProfile) {
                    // Update existing profile
                    await this.prisma.profile.update({
                        where: { userId },
                        data: filteredProfileData,
                    });
                } else {
                    // Create new profile only if at least one field is provided
                    await this.prisma.profile.create({
                        data: {
                            userId,
                            ...filteredProfileData,
                        },
                    });
                }
            }
        }

        const user = await this.prisma.user.update({
            where: { id: userId },
            data: updateData,
            include: {
                role: true,
                profile: true, // Include profile in response (null if not created)
            },
        });

        return { user: { id: user.id, username: user.username, email: user.email, phone: user.phone, profile: user.profile } };
    }

    async uploadAvatar(userId: number, file: Express.Multer.File) {
        // Define upload directory
        // const uploadDir = path.join(__dirname, '../../uploads/avatars');
        // const uploadDir = path.join(process.env.UPLOAD_DIR || './uploads', 'avatars');
        const uploadDir = path.join(process.cwd(), 'uploads', 'avatars'); // Use project root
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
            console.log("Created directory:", uploadDir);
        }

        // Validate file
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }

        // Generate unique filename
        const filename = `${userId}-${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`; // Sanitize filename
        const filePath = path.join(uploadDir, filename);

        console.log("Saving to:", path.join(__dirname, '../../uploads/avatars', filename));

        try {
            // Save file to filesystem
            fs.writeFileSync(filePath, file.buffer);

            // Update user with file path
            const updatedUser = await this.prisma.user.update({
                where: { id: userId },
                data: { profilePicturePath: `/uploads/avatars/${filename}` },
                include: { role: true, profile: true },
            });

            return {
                status: 200,
                message: 'Avatar uploaded successfully',
                user: {
                    id: updatedUser.id,
                    username: updatedUser.username,
                    email: updatedUser.email,
                    phone: updatedUser.phone,
                    profilePicturePath: updatedUser.profilePicturePath,
                    profile: updatedUser.profile,
                },
            };
        } catch (error) {
            // Clean up file if update fails
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            throw new InternalServerErrorException('Failed to upload avatar');
        }
    }

    async getUsers() {
        return await this.prisma.user.findMany({
            where: {
                roleId: {
                    notIn: [1], // Exclude Developer Only
                },
            },
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
        return await this.prisma.category.findMany({
            include: {
                createdBy: { select: { id: true, username: true, role: { select: { name: true } }, profilePicturePath: true } },
                updatedBy: { select: { id: true, username: true, role: { select: { name: true } }, profilePicturePath: true } },
            },
        });
    }

    async createCategory(createCategoryDto: CreateCategoryDto, userId: number) {
        const { id, name } = createCategoryDto;

        // Validate 4-digit ID
        if (id > 9999 || id < 1) {
            throw new BadRequestException('Category ID must be a 4-digit number (1-9999)');
        }
        // Check for existing Category ID
        const existingCategory = await this.prisma.category.findUnique({ where: { id } });
        if (existingCategory) {
            throw new ConflictException('Category ID already exists');
        }
        // Check for existing Category Name
        const existingName = await this.prisma.category.findUnique({ where: { name } });
        if (existingName) {
            throw new ConflictException('Category Name already exists');
        }
        return await this.prisma.category.create({
            data: {
                id,
                name,
                createdById: userId,
                createdAt: new Date(),
            },
            include: {
                createdBy: { select: { id: true, username: true, role: { select: { name: true } }, profilePicturePath: true } },
            },
        });
    }

    async updateCategoryGrock(id: number, updateCategoryDto: UpdateCategoryDto, userId: number) {
        const category = await this.prisma.category.findUnique({ where: { id } });

        if (!category) {
            throw new NotFoundException('Category not found');
        }

        const { id: newId, name } = updateCategoryDto;
        const data: any = {};

        // Validate and check new ID 
        if (newId) {
            if (newId > 9999 || newId < 1) {
                throw new BadRequestException('Category ID must be a 4-digit number (1-9999)');
            }
            if (newId !== id) {
                const existingCategory = await this.prisma.category.findUnique({ where: { id: newId } });
                if (existingCategory) {
                    throw new ConflictException('New category ID already exists');
                }
                data.id = newId;
            }
        }

        // Validate and check new name if provided
        if (name) {
            const existingName = await this.prisma.category.findUnique({ where: { name } });
            if (existingName && existingName.id !== id) {
                throw new ConflictException('Category name already exists');
            }
            data.name = name;
        }

        // Only update if there are changes
        if (Object.keys(data).length > 0) {
            data.updatedById = userId;
            data.updatedAt = new Date();
        } else {
            return category; // No changes, return original category
        }

        return await this.prisma.category.update({
            where: { id }, // Use original ID for the update
            data,
            include: {
                createdBy: { select: { id: true, username: true, role: { select: { name: true } }, profilePicturePath: true } },
                updatedBy: { select: { id: true, username: true, role: { select: { name: true } }, profilePicturePath: true } },
            },
        });
    }

    async updateCategory(id: number, updateCategoryDto: UpdateCategoryDto, userId: number) {
        const category = await this.prisma.category.findUnique({ where: { id } });

        if (!category) {
            throw new NotFoundException('Category not found');
        }

        const { id: newId, name } = updateCategoryDto;
        // const data: any = {};

        // ✅ Check if the new ID is different and valid
        if (newId !== undefined && newId !== id) {
            if (newId > 9999 || newId < 1) {
                throw new BadRequestException('Category ID must be a 4-digit number (1-9999)');
            }
            const idExists = await this.prisma.category.findUnique({ where: { id: newId } });
            if (idExists) {
                throw new ConflictException('Category ID already exists');
            }
        }

        // ✅ Check if the new name is different and valid
        if (name) {
            const nameExists = await this.prisma.category.findUnique({ where: { name } });
            if (nameExists && nameExists.id !== id) {
                throw new ConflictException('Category name already exists');
            }
        }

        // ✅ Use Prisma transaction when updating ID
        if (newId !== undefined && newId !== id) {
            return await this.prisma.$transaction([
                this.prisma.category.delete({ where: { id } }),
                this.prisma.category.create({
                    data: {
                        id: newId,
                        name: name ?? category.name,
                        createdById: category.createdById,
                        createdAt: category.createdAt,
                        updatedById: userId,
                        updatedAt: new Date(),
                    },
                    include: {
                        createdBy: { select: { id: true, username: true, role: { select: { name: true } }, profilePicturePath: true } },
                        updatedBy: { select: { id: true, username: true, role: { select: { name: true } }, profilePicturePath: true } },
                    },
                }),
            ]).then(res => res[1]); // return created category
        }

        // ✅ Standard update (if ID is not changed)
        return await this.prisma.category.update({
            where: { id },
            data: {
                ...(name ? { name } : {}),
                updatedById: userId,
                updatedAt: new Date(),
            },
            include: {
                createdBy: { select: { id: true, username: true, role: { select: { name: true } }, profilePicturePath: true } },
                updatedBy: { select: { id: true, username: true, role: { select: { name: true } }, profilePicturePath: true } },
            },
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

    async getAdminOrders(userId: number) {
        const shops = await this.prisma.shop.findMany({
            where: { ownerId: userId }, // Fetch shops owned by the user
            select: { id: true },
        });
        const shopIds = shops.map((shop) => shop.id);

        return await this.prisma.order.findMany({
            where: { shopId: { in: shopIds } },
            include: { product: true, user: true },
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