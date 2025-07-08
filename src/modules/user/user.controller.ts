import { Controller, Post, Body, Patch, UseGuards, UseInterceptors, UploadedFile, Param, Get, Request, UnauthorizedException } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { ParseFilePipe, MaxFileSizeValidator } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // 👤 User Management APIs

  @Post('create-user') // 🌐 Route: /user/create-user (Authenticated)
  @UseGuards(JwtAuthGuard)
  async createUser(@Body() dto: CreateUserDto, @Request() req) {
    if (req.user.role !== 1) {
      throw new UnauthorizedException('Only developers can create users');
    }
    return this.userService.createUser(dto);
  }

  @Patch('update-user') // 🌐 Route: /user/update-user (Authenticated)
  @UseGuards(JwtAuthGuard)
  async updateUser(@Request() req, @Body() dto: UpdateUserDto) {
    const userId = req.user.userId; // Get user ID from JWT token
    return this.userService.updateUser(userId, dto);
  }

  @Patch('upload-avatar') // 🌐 Route: /user/upload-avatar (Authenticated)
  @UseGuards(JwtAuthGuard)
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
    return this.userService.uploadAvatar(userId, file); // Pass file
  }

  @Get('developer-users') // 🌐 Route: /auth/developer-users (Authenticated)
  @UseGuards(JwtAuthGuard)
  async getDeveloperUsers(@Request() req) {
    if (req.user.role !== 1) throw new UnauthorizedException('Only Developer can view Developer users');
    return this.userService.getDeveloperUsers();
  }

  @Get('developer-user/:id')
  @UseGuards(JwtAuthGuard)
  async getDeveloperUser(@Param('id') id: string, @Request() req) {
    if (req.user.role !== 1) throw new UnauthorizedException('Only Developer can view Developer user profile');
    return this.userService.getDeveloperUser(parseInt(id));
  }

  @Get('users')
  @UseGuards(JwtAuthGuard)
  async getUsers(@Request() req) {
    if (req.user.role !== 1 && req.user.role !== 2 && req.user.role !== 3)
      throw new UnauthorizedException('Only Developer, Platform Admin and Operations Admin can view users');
    return this.userService.getUsers();
  }

  @Get('user/:id')
  @UseGuards(JwtAuthGuard)
  async getUser(@Param('id') id: string, @Request() req) {
    if (req.user.role !== 1) throw new UnauthorizedException('Only Developer can view user details');
    return this.userService.getUser(parseInt(id));
  }
}