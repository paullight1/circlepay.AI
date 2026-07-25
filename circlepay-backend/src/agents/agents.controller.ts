import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';

import { CurrentUser } from '../common/current-user.decorator';
import { AgentsService } from './agents.service';
import { LinkAccountDto, RedeemScratchCardDto, RequestWithdrawalDto } from './dto';

@Controller()
export class AgentsController {
  constructor(private readonly agents: AgentsService) {}

  // ── Agent locator ──
  @Get('agents')
  listAgents() {
    return this.agents.listAgents();
  }

  // ── Linked accounts ──
  @Get('accounts')
  listAccounts(@CurrentUser('id') userId: string) {
    return this.agents.listLinkedAccounts(userId);
  }

  @Post('accounts')
  linkAccount(@CurrentUser('id') userId: string, @Body() dto: LinkAccountDto) {
    return this.agents.linkAccount(userId, dto.bank);
  }

  // ── Scratch card ──
  @Post('agents/scratch-card')
  @HttpCode(200)
  redeem(@CurrentUser('id') userId: string, @Body() dto: RedeemScratchCardDto) {
    return this.agents.redeemScratchCard(userId, dto.serial);
  }

  // ── Kiosk withdrawal ──
  @Get('agents/withdrawal')
  getWithdrawal(@CurrentUser('id') userId: string) {
    return this.agents.getWithdrawal(userId);
  }

  @Post('agents/withdrawal')
  requestWithdrawal(@CurrentUser('id') userId: string, @Body() dto: RequestWithdrawalDto) {
    return this.agents.requestWithdrawal(userId, dto.amount);
  }

  @Post('agents/withdrawal/complete')
  @HttpCode(200)
  completeWithdrawal(@CurrentUser('id') userId: string) {
    return this.agents.completeWithdrawal(userId);
  }

  @Post('agents/withdrawal/cancel')
  @HttpCode(200)
  cancelWithdrawal(@CurrentUser('id') userId: string) {
    return this.agents.cancelWithdrawal(userId);
  }
}
