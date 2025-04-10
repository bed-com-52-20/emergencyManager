// user.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { FirebaseService } from './firebase.service';
import { EmergencyData } from 'src/dto/dto';

@Controller('emergency')
export class FirebaseController {
  constructor(private readonly firebaseService: FirebaseService) {}

  @Post('trigger')
  async triggerEmergency(@Body() userData: EmergencyData) {
    console.log('Accesssed')
    try {
        return await this.firebaseService.saveAndSendNotification(userData);
    } catch (error) {
        console.log(error)
    }
  }

  @Post('trigger/all')
  async triggerCommunityAlarm(@Body() userData: EmergencyData) {
    console.log('Accesssed')
    try {
        return await this.firebaseService.triggerCommunityAlarm(userData);
    } catch (error) {
        console.log(error)
    }
  }
}
