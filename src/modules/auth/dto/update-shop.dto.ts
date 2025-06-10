import { IsString, IsOptional } from 'class-validator';

export class UpdateShopDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    description?: string;
}