import { Type } from 'class-transformer';
import { IsIn, IsInt, IsNumber, IsOptional, IsPositive, IsString, MaxLength, Min } from 'class-validator';

const CATEGORIES = ['Burial', 'Birthday', 'Medical', 'Wedding', 'School Fees', 'Community'] as const;
const METHODS = ['wallet', 'transfer', 'ussd', 'agent'] as const;

export class CreateCampaignDto {
  @IsString()
  @MaxLength(120)
  title!: string;

  @IsIn(CATEGORIES)
  category!: (typeof CATEGORIES)[number];

  @IsNumber()
  @IsPositive()
  target!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  deadlineDays!: number;

  @IsString()
  @MaxLength(1000)
  about!: string;
}

export class DonateDto {
  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsIn(METHODS)
  method!: (typeof METHODS)[number];

  @IsOptional()
  @IsString()
  @MaxLength(80)
  donor?: string; // omit or "Anonymous"
}
