import { IsInt, IsNumber, IsOptional, IsPositive, IsString, MaxLength, Min } from 'class-validator';

export class AddMoneyDto {
  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsString()
  @MaxLength(80)
  source!: string; // e.g. "GTBank •••• 1234"
}

export class WithdrawDto {
  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsString()
  @MaxLength(80)
  destination!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  fee?: number;
}

export class TransferDto {
  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsString()
  @MaxLength(80)
  recipient!: string;
}

// (kept generic for pagination-friendly listing later)
export class ListQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;
}
