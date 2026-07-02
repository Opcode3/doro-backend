import {
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsOptional,
  Min,
} from 'class-validator';

export class CreateServiceDto {
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(5)
  duration!: number; // minutes

  @IsNumber()
  @IsPositive()
  price!: number;
}
