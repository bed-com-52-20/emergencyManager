// user.controller.ts
import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { FirebaseService } from './firebase.service';
import { EmergencyData, RespondData } from 'src/dto/dto';

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
        throw new HttpException('Operation failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('trigger/all')
  async triggerCommunityAlarm(@Body() userData: EmergencyData) {
    console.log('Accesssed')
    try {
        return await this.firebaseService.triggerCommunityAlarm(userData);
    } catch (error) {
        console.log(error)
        throw new HttpException('Operation failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('respond')
  async respond(@Body() data: RespondData){
    console.log('Accesssed')
    try {
        return await this.firebaseService.respond(data);
    } catch (error) {
        console.log(error)
        throw new HttpException('Operation failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
