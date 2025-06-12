import { IsString, IsNumber, IsOptional, IsNotEmpty, IsInt } from 'class-validator';

export class CreateShopProductDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsNumber()
    @IsNotEmpty()
    price: number;

    @IsInt()
    @IsNotEmpty()
    stock: number;

    @IsInt()
    @IsNotEmpty()
    shopId: number;
}