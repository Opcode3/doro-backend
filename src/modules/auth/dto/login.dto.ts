import { IsNotEmpty, IsPhoneNumber } from 'class-validator';

export class LoginDto {
  @IsPhoneNumber('NG')
  phone!: string;

  @IsNotEmpty()
  password!: string;
}
