import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsPhoneNumber,
  MinLength,
} from 'class-validator';
import { UserRole } from '@prisma/client';

export class RegisterDto {
  @IsEnum(UserRole)
  role!: UserRole;

  @IsNotEmpty()
  firstName!: string;

  @IsNotEmpty()
  lastName!: string;

  @IsPhoneNumber('NG') // Adjust for Nigeria
  phone!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsNotEmpty()
  @MinLength(6)
  password!: string;
}
