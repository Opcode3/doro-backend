import {
  IsEnum,
  IsString,
  IsOptional,
  IsEmail,
  IsNotEmpty,
  ValidateIf,
} from 'class-validator';
import { UserRole, BusinessCategory } from '@prisma/client';

export class RegisterDto {
  @IsEnum(UserRole)
  @IsNotEmpty()
  role!: UserRole;

  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @IsString()
  @IsNotEmpty()
  phone!: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsNotEmpty()
  password!: string;

  // Business fields - only required when role is MERCHANT
  @ValidateIf((o: RegisterDto) => o.role === UserRole.MERCHANT)
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ValidateIf((o: RegisterDto) => o.role === UserRole.MERCHANT)
  @IsEnum(BusinessCategory)
  category?: BusinessCategory;

  @ValidateIf((o: RegisterDto) => o.role === UserRole.MERCHANT)
  @IsString()
  @IsNotEmpty()
  address?: string;

  @ValidateIf((o: RegisterDto) => o.role === UserRole.MERCHANT)
  location?: { lat: number; lng: number }; // You may need a custom validator for object
}
