import {
  IsOptional,
  IsString,
  IsDateString,
  IsInt,
  Min,
} from 'class-validator';

export class CreateVirtualAccountDto {
  @IsString()
  accountName!: string;

  @IsOptional()
  @IsString()
  accountRef?: string;

  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  amount?: number;
}
