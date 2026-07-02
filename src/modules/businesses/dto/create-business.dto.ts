import { IsNotEmpty, IsEnum, IsOptional, IsString } from 'class-validator';
import { BusinessCategory } from '@prisma/client';

export class CreateBusinessDto {
  @IsNotEmpty()
  name!: string;

  @IsNotEmpty()
  address!: string;

  @IsEnum(BusinessCategory)
  category!: BusinessCategory;

  @IsNotEmpty()
  location!: { lat: number; lng: number };

  @IsOptional()
  @IsString()
  description?: string;
}
