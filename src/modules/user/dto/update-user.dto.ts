import { IsString, IsOptional, Matches } from 'class-validator';

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

export class UpdateUserDto {
    @IsString()
    @IsOptional()
    username?: string;

    @IsString()
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    @Matches(/^\+\d{1,2}\s\d{10}$/, {
        message: 'Phone number must start with + followed by 1-2 digits country code and 10 digits (e.g., +12025550123)',
    })
    phone?: string;

    @IsOptional()
    profile?: ProfileDto;
}