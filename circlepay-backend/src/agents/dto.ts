import { IsNumber, IsPositive, IsString, MaxLength, MinLength } from 'class-validator';

export class LinkAccountDto {
  @IsString()
  @MaxLength(40)
  bank!: string;
}

export class RedeemScratchCardDto {
  @IsString()
  @MinLength(14)
  @MaxLength(24) // allows spaces/dashes; stripped server-side
  serial!: string;
}

export class RequestWithdrawalDto {
  @IsNumber()
  @IsPositive()
  amount!: number;
}
