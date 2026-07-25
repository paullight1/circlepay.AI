import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  firstName?: string;
}

export class SetKycDto {
  @Type(() => Number)
  @IsInt()
  @IsIn([0, 1, 2])
  tier!: 0 | 1 | 2;
}

export class SetPinDto {
  @IsString()
  @Matches(/^\d{4,6}$/, { message: 'PIN must be 4–6 digits' })
  pin!: string;

  @IsOptional()
  @IsBoolean()
  biometricsEnabled?: boolean;
}

export class VerifyPinDto {
  @IsString()
  @Length(4, 6)
  pin!: string;
}
