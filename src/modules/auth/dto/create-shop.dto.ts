import { IsString, IsOptional } from 'class-validator';

export class CreateShopDto {
    @IsString()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;
}