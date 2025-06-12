import { IsString, IsNumber, IsOptional, IsInt } from 'class-validator';

export class UpdateShopProductDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsNumber()
    @IsOptional()
    price?: number;

    @IsInt()
    @IsOptional()
    stock?: number;

    @IsInt()
    @IsOptional()
    shopId?: number;
}