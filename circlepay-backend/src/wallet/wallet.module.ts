import { Global, Module } from '@nestjs/common';

import { LedgerService } from './ledger.service';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';

/**
 * Global so any feature module can inject LedgerService to move money atomically
 * alongside its own writes (circles, partpay, campaigns, agents).
 */
@Global()
@Module({
  controllers: [WalletController],
  providers: [WalletService, LedgerService],
  exports: [WalletService, LedgerService],
})
export class WalletModule {}
