import { Controller, Get } from '@nestjs/common';

import { CurrentUser } from '../common/current-user.decorator';
import { TrustService } from './trust.service';

@Controller('trust')
export class TrustController {
  constructor(private readonly trust: TrustService) {}

  @Get()
  getScore(@CurrentUser('id') userId: string) {
    return this.trust.getScore(userId);
  }

  @Get('risk')
  getRisk(@CurrentUser('id') userId: string) {
    return this.trust.getRisk(userId);
  }
}
