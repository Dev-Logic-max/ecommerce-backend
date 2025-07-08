import { IsString, IsNotEmpty, IsInt, IsOptional, Max, Min } from 'class-validator';

export class CreateCategoryDto {
    @IsInt()
    @IsNotEmpty()
    @Min(1)        // Minimum value to avoid invalid IDs
    @Max(9999)     // 4-digit limit
    id: number;

    @IsString()
    @IsNotEmpty()
    name: string;
}