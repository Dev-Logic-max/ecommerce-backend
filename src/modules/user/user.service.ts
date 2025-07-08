import { Injectable, ConflictException, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  // 👤 User Management APIs logic

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
      include: { role: true },
    });
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

    // Check if username is already exists
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
        Object.entries(profileData).filter(([_, value]) => value !== undefined && value !== null),
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
    const uploadDir = path.join(process.cwd(), 'uploads', 'avatars');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log('Created directory:', uploadDir);
    }

    // Validate file
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { profilePicturePath: true },
    });

    // Generate unique filename
    const filename = `${userId}-${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
    const filePath = path.join(uploadDir, filename);

    console.log('Saving to:', filePath);

    try {
      if (existingUser?.profilePicturePath) {
        const oldFilePath = path.join(uploadDir, existingUser.profilePicturePath.replace('/uploads/avatars/', ''));
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
          console.log('Deleted old avatar:', oldFilePath);
        }
      }

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
}