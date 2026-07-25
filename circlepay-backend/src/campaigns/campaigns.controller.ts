import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Post } from '@nestjs/common';

import { CurrentUser } from '../common/current-user.decorator';
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto, DonateDto } from './dto';

@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaigns: CampaignsService) {}

  @Get()
  list(@CurrentUser('id') userId: string) {
    return this.campaigns.list(userId);
  }

  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateCampaignDto) {
    return this.campaigns.create(userId, dto);
  }

  @Get(':id')
  getOne(@CurrentUser('id') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.campaigns.getOne(userId, id);
  }

  @Post(':id/donate')
  @HttpCode(200)
  donate(@CurrentUser('id') userId: string, @Param('id', ParseUUIDPipe) id: string, @Body() dto: DonateDto) {
    return this.campaigns.donate(userId, id, dto);
  }
}
