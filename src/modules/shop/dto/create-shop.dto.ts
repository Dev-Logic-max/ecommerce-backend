import { IsString, IsOptional, IsArray, IsNumber } from 'class-validator';

export class CreateShopDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsArray()
  @IsOptional()
  subcategories?: string[];

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  zipCode?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  businessLicense?: string;

  @IsString()
  @IsOptional()
  taxId?: string;

  @IsString()
  @IsOptional()
  spaceCapacity?: string;

  @IsString()
  @IsOptional()
  productCapacity?: string;

  @IsOptional()
  features?: {
    onlineOrdering?: boolean;
    deliveryService?: boolean;
    pickupService?: boolean;
    returnPolicy?: boolean;
    customerSupport?: boolean;
    loyaltyProgram?: boolean;
  };

  @IsString()
  @IsOptional()
  returnPolicy?: string;

  @IsString()
  @IsOptional()
  shippingPolicy?: string;

  @IsString()
  @IsOptional()
  privacyPolicy?: string;

  @IsNumber()
  @IsOptional()
  progress?: number;
}