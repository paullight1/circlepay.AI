import { Module } from '@nestjs/common';

import { PartPayController } from './partpay.controller';
import { PartPayService } from './partpay.service';

@Module({
  controllers: [PartPayController],
  providers: [PartPayService],
})
export class PartPayModule {}
