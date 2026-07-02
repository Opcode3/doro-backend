import { IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { BusinessCategory } from '@prisma/client';

export class RegisterBusinessDto {
  @IsNotEmpty()
  name!: string;

  @IsNotEmpty()
  address!: string;

  @IsEnum(BusinessCategory)
  category!: BusinessCategory;

  location!: { lat: number; lng: number }; // or string for now

  @IsOptional()
  description?: string;
}
