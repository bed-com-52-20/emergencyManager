import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FirebaseModule } from './firebase/firebase.module';
import { BroadcastModule } from './broadcast/broadcast.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [FirebaseModule, BroadcastModule, ConfigModule.forRoot({
    isGlobal: true, envFilePath: process.env.NODE_ENV === 'production' ? '.env.prod' : 'src/.env'
  })],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
