import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class RequestOtpDto {
  // Lenient on formatting so "+234 803 555 0147" style numbers pass.
  @IsString()
  @MinLength(7)
  @MaxLength(20)
  phone!: string;
}

export class VerifyOtpDto {
  @IsString()
  @MinLength(7)
  @MaxLength(20)
  phone!: string;

  @IsString()
  @Matches(/^\d{6}$/, { message: 'OTP must be 6 digits' })
  code!: string;

  // Provided on first sign-up so we can create the account with a real name.
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name?: string;
}
