import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Post } from '@nestjs/common';

import { CurrentUser } from '../common/current-user.decorator';
import { CirclesService } from './circles.service';
import { CreateCircleDto } from './dto';

@Controller('circles')
export class CirclesController {
  constructor(private readonly circles: CirclesService) {}

  @Get()
  list(@CurrentUser('id') userId: string) {
    return this.circles.list(userId);
  }

  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateCircleDto) {
    return this.circles.create(userId, dto);
  }

  @Get(':id')
  getOne(@CurrentUser('id') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.circles.getOne(userId, id);
  }

  @Post(':id/contribute')
  @HttpCode(200)
  contribute(@CurrentUser('id') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.circles.contribute(userId, id);
  }
}
