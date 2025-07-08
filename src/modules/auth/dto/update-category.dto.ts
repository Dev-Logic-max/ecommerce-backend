import { IsString, IsNotEmpty, IsOptional, IsInt, Max, Min } from 'class-validator';

export class UpdateCategoryDto {
    @IsInt()
    @IsOptional()
    @Min(1)
    @Max(9999)
    id?: number; // Optional custom ID for update

    @IsString()
    @IsOptional()
    name?: string;
}