import { Type } from 'class-transformer';
import { IsIn, IsInt, IsNumber, IsOptional, IsPositive, IsString, MaxLength, Min } from 'class-validator';

const CATEGORIES = ['Rent', 'School Fees', 'Medical Bills', 'Consumer Products', 'Business Services', 'Other'] as const;
const MODELS = ['gradual', 'upfront'] as const;

export class CreatePlanDto {
  @IsString()
  @MaxLength(120)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  detail?: string;

  @IsIn(CATEGORIES)
  category!: (typeof CATEGORIES)[number];

  @IsIn(MODELS)
  model!: (typeof MODELS)[number];

  @IsNumber()
  @IsPositive()
  totalAmount!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  durationMonths!: number;
}
