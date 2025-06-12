import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateWarehouseDto {
    @IsString()
    name: string;

    @IsString()
    @IsOptional()
    location?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    warehouseIcon?: string;

    @IsNumber()
    @IsOptional()
    capacity?: number;
}