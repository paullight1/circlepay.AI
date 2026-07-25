import { Body, Controller, Get, Post } from '@nestjs/common';

import { CurrentUser } from '../common/current-user.decorator';
import { AddMoneyDto, TransferDto, WithdrawDto } from './dto';
import { WalletService } from './wallet.service';

@Controller('wallet')
export class WalletController {
  constructor(private readonly wallet: WalletService) {}

  @Get()
  getWallet(@CurrentUser('id') userId: string) {
    return this.wallet.getWallet(userId);
  }

  @Get('transactions')
  getTransactions(@CurrentUser('id') userId: string) {
    return this.wallet.getTransactions(userId);
  }

  @Post('add-money')
  addMoney(@CurrentUser('id') userId: string, @Body() dto: AddMoneyDto) {
    return this.wallet.addMoney(userId, dto.amount, dto.source);
  }

  @Post('withdraw')
  withdraw(@CurrentUser('id') userId: string, @Body() dto: WithdrawDto) {
    return this.wallet.withdraw(userId, dto.amount, dto.destination, dto.fee);
  }

  @Post('transfer')
  transfer(@CurrentUser('id') userId: string, @Body() dto: TransferDto) {
    return this.wallet.transfer(userId, dto.amount, dto.recipient);
  }
}
