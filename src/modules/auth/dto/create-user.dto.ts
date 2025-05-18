import { IsString, IsInt, IsEnum, IsOptional } from 'class-validator';

export class CreateUserDto {
    @IsString()
    username: string;

    @IsOptional()
    @IsString()
    email?: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsString()
    password: string;

    @IsEnum(['PlatformAdmin', 'OperationsAdmin', 'Developer'])
    role: 'PlatformAdmin' | 'OperationsAdmin' | 'Developer';
}