import { IsString, IsEmail, IsOptional, MinLength } from 'class-validator';

class ProfileDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    address?: string;

    @IsString()
    @IsOptional()
    city?: string;

    @IsString()
    @IsOptional()
    country?: string;
}

export class SignupDto {
    @IsOptional()
    profile?: ProfileDto;

    @IsString()
    username: string;

    @IsEmail()
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsString()
    @MinLength(6)
    password: string;
}