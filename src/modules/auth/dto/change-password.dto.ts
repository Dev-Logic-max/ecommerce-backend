// change-password.dto.ts
import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @MinLength(5, { message: 'Password must be at least 6 characters long' })
  currentPassword: string;

  @IsString()
  @MinLength(5, { message: 'New password must be at least 6 characters long' })
  newPassword: string;
}