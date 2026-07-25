import { Module } from '@nestjs/common';

import { UsersModule } from '../users/users.module';
import { CirclesController } from './circles.controller';
import { CirclesService } from './circles.service';

@Module({
  imports: [UsersModule],
  controllers: [CirclesController],
  providers: [CirclesService],
})
export class CirclesModule {}
