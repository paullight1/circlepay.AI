import { Type } from 'class-transformer';
import { IsIn, IsInt, IsNumber, IsOptional, IsPositive, IsString, MaxLength, Min } from 'class-validator';

const FREQUENCIES = ['daily', 'weekly', 'monthly'] as const;

export class CreateCircleDto {
  @IsString()
  @MaxLength(80)
  name!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  memberCount!: number;

  @IsNumber()
  @IsPositive()
  amountPerMember!: number;

  @IsIn(FREQUENCIES)
  frequency!: (typeof FREQUENCIES)[number];

  @IsOptional()
  @IsString()
  startDate?: string; // ISO
}
