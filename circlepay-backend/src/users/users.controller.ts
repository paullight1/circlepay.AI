import { Body, Controller, Get, HttpCode, Patch, Post } from '@nestjs/common';

import { CurrentUser } from '../common/current-user.decorator';
import { SetKycDto, SetPinDto, UpdateUserDto, VerifyPinDto } from './dto';
import { UsersService } from './users.service';

@Controller('me')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  me(@CurrentUser('id') userId: string) {
    return this.users.get(userId);
  }

  @Patch()
  update(@CurrentUser('id') userId: string, @Body() dto: UpdateUserDto) {
    return this.users.update(userId, dto);
  }

  @Post('kyc')
  setKyc(@CurrentUser('id') userId: string, @Body() dto: SetKycDto) {
    return this.users.setKycTier(userId, dto.tier);
  }

  @Post('pin')
  setPin(@CurrentUser('id') userId: string, @Body() dto: SetPinDto) {
    return this.users.setPin(userId, dto.pin, dto.biometricsEnabled ?? false);
  }

  @Post('verify-pin')
  @HttpCode(200)
  async verifyPin(@CurrentUser('id') userId: string, @Body() dto: VerifyPinDto) {
    return { ok: await this.users.verifyPin(userId, dto.pin) };
  }

  @Post('onboarded')
  @HttpCode(200)
  setOnboarded(@CurrentUser('id') userId: string) {
    return this.users.setOnboarded(userId, true);
  }
}
