import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateWarehouseProductDto {
    @IsString()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsNumber()
    price: number;

    @IsNumber()
    stock: number;
}