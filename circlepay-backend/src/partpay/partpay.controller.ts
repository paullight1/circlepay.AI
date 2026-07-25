import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Post } from '@nestjs/common';

import { CurrentUser } from '../common/current-user.decorator';
import { PartPayService } from './partpay.service';
import { CreatePlanDto } from './dto';

@Controller('partpay')
export class PartPayController {
  constructor(private readonly partpay: PartPayService) {}

  @Get()
  list(@CurrentUser('id') userId: string) {
    return this.partpay.list(userId);
  }

  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreatePlanDto) {
    return this.partpay.create(userId, dto);
  }

  @Get(':id')
  getOne(@CurrentUser('id') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.partpay.getOne(userId, id);
  }

  @Post(':id/installments/:installmentId/pay')
  @HttpCode(200)
  pay(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('installmentId', ParseUUIDPipe) installmentId: string,
  ) {
    return this.partpay.payInstallment(userId, id, installmentId);
  }
}
