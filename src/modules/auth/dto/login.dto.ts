import { IsOptional, IsString } from 'class-validator';

export class LoginDto {
    @IsString()
    @IsOptional()
    username?: string;

    @IsString()
    @IsOptional()
    email?: string;

    @IsString()
    password!: string;
}