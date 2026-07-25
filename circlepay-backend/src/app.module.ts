import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';

import { AppController } from './app.controller';
import { JwtAuthGuard } from './common/jwt-auth.guard';
import { DbModule } from './db/db.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { WalletModule } from './wallet/wallet.module';
import { NotificationsModule } from './notifications/notifications.module';
import { CirclesModule } from './circles/circles.module';
import { PartPayModule } from './partpay/partpay.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { AgentsModule } from './agents/agents.module';
import { TrustModule } from './trust/trust.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN', '30d') },
      }),
    }),
    DbModule,
    // Global providers first (LedgerService, NotificationsService are injected everywhere).
    WalletModule,
    NotificationsModule,
    UsersModule,
    AuthModule,
    CirclesModule,
    PartPayModule,
    CampaignsModule,
    AgentsModule,
    TrustModule,
  ],
  controllers: [AppController],
  providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class AppModule {}
