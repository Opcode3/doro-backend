import { IsOptional } from 'class-validator';

export class BusinessQueryDto {
  @IsOptional()
  lat?: number;

  @IsOptional()
  lng?: number;

  @IsOptional()
  radiusKm: number = 10;

  @IsOptional()
  category?: string;

  @IsOptional()
  search?: string;
}
