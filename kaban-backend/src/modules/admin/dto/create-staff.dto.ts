import { IsString, IsNotEmpty, IsEnum, MinLength, Matches } from 'class-validator';
import { UserRole } from '../../users/models/user.model';

export class CreateStaffDto {
  @IsString() @IsNotEmpty()
  name: string;

  @IsString()
  @Matches(/^(\+254|0)[17]\d{8}$/, { message: 'Phone must be a valid Kenyan number' })
  phone: string;

  @IsString() @MinLength(8)
  password: string;

  @IsEnum([UserRole.CLERK, UserRole.ADMIN])
  role: UserRole.CLERK | UserRole.ADMIN;
}
