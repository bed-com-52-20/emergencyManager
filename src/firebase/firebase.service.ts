// firebase.service.ts
import * as admin from 'firebase-admin';
import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { EmergencyData, Location, RespondData } from 'src/dto/dto';
import { GeoPoint } from '@google-cloud/firestore';
import { LocationService } from './location.service';

@Injectable()
export class FirebaseService implements OnModuleInit {
  onModuleInit() {
    admin.initializeApp({
      credential: admin.credential.cert(require(
        // '/home/unimathe/emergency/communitysafetyapplication1-firebase-adminsdk-fbsvc-937f53ad15.json'
        'C:/Users/HP/Desktop/safety/emergency/communitysafetyapplication1-firebase-adminsdk-fbsvc-937f53ad15.json'
      ) as admin.ServiceAccount),
    });
  }
//   
  constructor(private readonly locationService: LocationService){}
  get firestore() {
    return admin.firestore();
  }

  get messaging() {
    return admin.messaging();
  }

  async saveAndSendNotification(userData: EmergencyData){
    try {
        const documentRef = this.firestore.collection('emergencies').doc()
        await documentRef.set({ id: documentRef.id, photoUri: "", location: new GeoPoint(userData.latitude,
          userData.longitude
        ),
          responderId: "", triggerId: userData.triggerId, triggeredAt: userData.triggeredAt,
          type: userData.type, sourceDistrict: userData.sourceDistrict
         });

        const usersRef = this.firestore.collection('users');
        const querySnapshot = await usersRef.where('role', '==', 'officer').get();
        if (querySnapshot.empty){
          console.log('no documents found')
          throw new NotFoundException('No officers registered')
        }
        const targetLocation: Location = {latitude: userData.latitude, longitude: userData.longitude}
        const nearbyUsers = this.locationService.getNearbyUsers(targetLocation, querySnapshot)
        if (nearbyUsers.length === 0){
          console.log('No officers')
          throw new NotFoundException('No officers near a 10km radius from you')
        }
        const tokens = nearbyUsers
          .map((user: any) => user?.deviceToken)
          .filter((token: string | undefined | null) => token && token !== '');
        if (tokens.length != 0){
          const emergenciesRef = this.firestore.collection('emergencies');
          const occurrences = (await emergenciesRef.where('type', '==', userData.type).get()).size;
          for (let index = 0; index < tokens.length; index++) {
            if (tokens[index] !== null && tokens[index] !== ''){
              await this.sendNotification(userData, tokens[index], userData.triggerName, occurrences);
            }
            else{
              console.log('Null oe empty deviceToken')
            }
          }
          return documentRef.id
        }
        else{
          console.log('No tokens yet')
          throw new NotFoundException('No officers registered within a 10km radius from you')
        }
    } catch (error) {
        console.log(error)
        throw new error
    }
  }

  async triggerCommunityAlarm(userData: EmergencyData){
    try {
        const documentRef = this.firestore.collection('emergencies').doc()
        await documentRef.set({ id: documentRef.id, photoUri: "", 
          location: new GeoPoint(userData.latitude, userData.longitude ),
          responderId: "", triggerId: userData.triggerId, triggeredAt: userData.triggeredAt,
          type: userData.type, sourceDistrict: userData.sourceDistrict,
         });

        const usersRef = this.firestore.collection('users');
        try {
          const querySnapshot = await usersRef.where('role', 'in', ['officer', 'user']).get();
          if (querySnapshot.empty){
            console.log('no documents found')
            throw new NotFoundException('No users registered yet')
          }
          const targetLocation: Location = {latitude: userData.latitude, longitude: userData.longitude}
          const nearbyUsers = this.locationService.getNearbyUsers(targetLocation, querySnapshot)
          if (nearbyUsers.length === 0){
            console.log('No nearby 10km users found')
            throw new NotFoundException('No users within a 10km radius from you')
          }
          const tokens = nearbyUsers
            .map((user: any) => user?.deviceToken)
            .filter((token: string | undefined | null) => token && token !== '');
            if (tokens.length != 0){
              const emergenciesRef = this.firestore.collection('emergencies');
              const occurrences = (await emergenciesRef.where('type', '==', userData.type).get()).size;
              for (let index = 0; index < tokens.length; index++) {
                if (tokens[index] !== null && tokens[index] !== ''){
                  await this.sendNotification(userData, tokens[index], userData.triggerName, occurrences);
                }
                else{
                  console.log('Null or empty deviceToken')
                }
              }
              return documentRef.id
            }
            else{
              console.log('No tokens yet')
              throw new NotFoundException('No users registered within a 10km radius from you')
            }
        } catch (error0) {
          console.log(error0)
          throw new error0
        }
        // }
        // else{
        //   console.log('No users')
        // }
    } catch (error) {
        console.log(error)
        throw new error
    }
  }

  async sendNotification(userData: EmergencyData, deviceToken: string, fullName: string, occurrences: number){
    try {
      const message = {
        token: deviceToken, 
        notification: {
          title: `${userData.type} emergency`,
          body: `Location: ${new GeoPoint(userData.latitude, userData.longitude)}`,
        },
        data: {
          victim: fullName,
          occurrences: `${occurrences} times`
        },
      };
      console.log('sending message')
      const response = await this.messaging.send(message);
      console.log('message sent')
      return { message: 'Notification sent', fcmResponse: response };
    } catch (error) {
      console.log(error)
    }
  }

  async respond(data: RespondData){
    try{
      const documentRef = this.firestore.collection('emergencies').doc(data.id)
      await documentRef.set({responderId: data.responderId, respondedAt: data.respondedAt},
        {merge: true}
      );
      const targetUserSnapshot = this.firestore.collection('users').doc(data.triggerId).get();
      const targetUserData = (await targetUserSnapshot).data()
      const deviceToken = targetUserData?.deviceToken ?? null
      if (deviceToken !== null && deviceToken !== '') {
        await this.sendResponseNotification(deviceToken, data.responderName)
      } else {
        console.log('Null user Token')
      }
      
    }
    catch(error){
      console.log(error)
    }
  }

  async sendResponseNotification(deviceToken: string, responderName: string){
    try {
      const message = {
        token: deviceToken, 
        notification: {
          title: 'Emergency response',
          body: `Responder Name: ${responderName}`,
        },
      };
      console.log('sending message')
      const response = await this.messaging.send(message);
      console.log('message sent')
      return { message: 'Notification sent', fcmResponse: response };
    } catch (error) {
      console.log(error)
    }
  }
}
