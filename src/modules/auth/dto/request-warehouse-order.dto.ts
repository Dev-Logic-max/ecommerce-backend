import { IsNumber, IsNotEmpty, IsInt, IsOptional } from 'class-validator';

export class RequestWarehouseOrderDto {
    @IsInt()
    @IsNotEmpty()
    productId: number;

    @IsInt()
    @IsNotEmpty()
    quantity: number;

    @IsOptional()
    @IsInt()
    shopId?: number; // Optional for shop owners
}