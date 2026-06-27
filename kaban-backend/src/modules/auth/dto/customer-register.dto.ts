import { IsString, IsNotEmpty, MinLength, MaxLength, Matches } from 'class-validator';

export class CustomerRegisterDto {
  @IsString() @IsNotEmpty() @MaxLength(255)
  name: string;

  @IsString()
  @Matches(/^(\+254|0)[17]\d{8}$/, { message: 'Phone must be a valid Kenyan number (e.g. 0712345678)' })
  phone: string;

  @IsString() @IsNotEmpty() @MaxLength(20)
  houseNumber: string;

  @IsString() @IsNotEmpty() @MaxLength(255)
  estate: string;

  @IsString() @MinLength(8) @MaxLength(100)
  password: string;
}
