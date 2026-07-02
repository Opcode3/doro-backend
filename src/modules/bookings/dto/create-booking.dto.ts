import {
  IsNotEmpty,
  IsUUID,
  IsDateString,
  IsNumber,
  IsPositive,
} from 'class-validator';

export class CreateBookingDto {
  @IsUUID()
  @IsNotEmpty()
  serviceId!: string;

  @IsDateString()
  @IsNotEmpty()
  scheduledAt!: string;

  @IsNumber()
  @IsPositive()
  totalAmount!: number;
}
