import { IsString, IsEmail, IsOptional, MinLength } from 'class-validator';

export class SignupDto {
    @IsString()
    username!: string;

    @IsEmail()
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsString()
    @MinLength(6)
    password!: string;
}