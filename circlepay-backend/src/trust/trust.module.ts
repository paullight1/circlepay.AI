import { Module } from '@nestjs/common';

import { UsersModule } from '../users/users.module';
import { TrustController } from './trust.controller';
import { TrustService } from './trust.service';

@Module({
  imports: [UsersModule],
  controllers: [TrustController],
  providers: [TrustService],
})
export class TrustModule {}
