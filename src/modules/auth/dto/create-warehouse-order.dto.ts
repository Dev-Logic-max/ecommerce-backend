import { IsNumber, IsNotEmpty, IsInt, IsOptional } from 'class-validator';

export class CreateWarehouseOrderDto {
    @IsInt()
    @IsNotEmpty()
    productId: number;

    @IsInt()
    @IsNotEmpty()
    quantity: number;

    @IsOptional()
    @IsInt()
    shopId?: number; // Optional for shop owner requests
}