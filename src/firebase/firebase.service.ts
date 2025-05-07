// firebase.service.ts
import * as admin from 'firebase-admin';
import { ConflictException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { CancelTriggerData, EmergencyData, Location, RespondData } from 'src/dto/dto';
import { GeoPoint } from '@google-cloud/firestore';
import { LocationService } from './location.service';
import { NotificationService } from './notification.service';

@Injectable()
export class FirebaseService implements OnModuleInit {
  onModuleInit() {
    if (!admin.apps.length){
      admin.initializeApp({
        credential: admin.credential.cert(require(
          // '/home/unimathe/emergency/communitysafetyapplication1-firebase-adminsdk-fbsvc-937f53ad15.json'
          'C:/Users/HP/Desktop/safety/emergency/communitysafetyapplication1-firebase-adminsdk-fbsvc-937f53ad15.json'
        ) as admin.ServiceAccount),
      });
    }
  }
//   
  constructor(private readonly locationService: LocationService, 
    private readonly notificationService: NotificationService){}
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
          responderId: "", triggerId: userData.triggerId,
          triggeredAt: admin.firestore.Timestamp.fromDate(new Date(userData.triggeredAt)),
          type: userData.type, sourceDistrict: userData.sourceDistrict, victim: userData.triggerName
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
          .filter((token: string | undefined | null) => token && token.trim() !== '');
        if (tokens.length != 0){
          const emergenciesRef = this.firestore.collection('emergencies');
          const occurrences = (await emergenciesRef.where('type', '==', userData.type).get()).size;
          for (let index = 0; index < tokens.length; index++) {
            if (tokens[index] !== null && tokens[index] !== ''){
              await this.notificationService.sendNotification(userData, tokens[index], userData.triggerName,
                occurrences, documentRef.id, this.messaging, 'emergency'
              );
            }
            else{
              console.log('Null or empty deviceToken')
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
          responderId: "", triggerId: userData.triggerId,
          triggeredAt: admin.firestore.Timestamp.fromDate(new Date(userData.triggeredAt)),
          type: userData.type, sourceDistrict: userData.sourceDistrict, victim: userData.triggerName
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
                  await this.notificationService.sendNotification(userData, tokens[index], userData.triggerName, 
                    occurrences, documentRef.id, this.messaging, 'alarm'
                  );
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

  

  async respond(data: RespondData){
    try{
      const documentRef = this.firestore.collection('emergencies').doc(data.id);
      await this.firestore.runTransaction(async(transaction: admin.firestore.Transaction) => {
        const doc = await transaction.get(documentRef);
        const updates = {};

        if (!doc.exists || !doc.get('responderId') || doc.get('responderId') === '') {
          updates['responderId'] = data.responderId;
        }
        if (!doc.exists || !doc.get('respondedAt') || doc.get('respondedAt') === '') {
          updates['respondedAt'] = admin.firestore.Timestamp.fromDate(new Date(data.respondedAt));
        }

        if (Object.keys(updates).length > 0) {
          transaction.set(documentRef, updates, {merge: true});
        }
        else{
          throw new ConflictException('Already responded by someone else')
        }
      });

      const targetUserSnapshot = this.firestore.collection('users').doc(data.triggerId).get();
      const targetUserData = (await targetUserSnapshot).data()
      const deviceToken = targetUserData?.deviceToken ?? null
      if (deviceToken !== null && deviceToken !== '') {
        await this.notificationService.sendResponseNotification(deviceToken, data.responderName,
          this.messaging
        )
      } else {
        console.log('Null user Token')
      }
      
    }
    catch(error){
      console.log(error)
    }
  }

  

  async cancelTrigger(data: CancelTriggerData){
    try {
      try {
        const documentRef = this.firestore.collection('emergencies').doc(data.documentId)
        documentRef.delete()
      } catch (error0) {
        throw new error0;
      }
      if (data.triggerType == 'emergency'){
        const usersRef = this.firestore.collection('users');
        const querySnapshot = await usersRef.where('role', '==', 'officer').get();
        if (querySnapshot.empty){
          console.log('no documents found')
          return;
        }
        const targetLocation: Location = {latitude: data.latitude, longitude: data.longitude}
        const nearbyUsers = this.locationService.getNearbyUsers(targetLocation, querySnapshot)
        if (nearbyUsers.length === 0){
          console.log('No officers')
          return;
        }
        const tokens = nearbyUsers
          .map((user: any) => user?.deviceToken)
          .filter((token: string | undefined | null) => token && token !== '');
        if (tokens.length != 0){
          for (let index = 0; index < tokens.length; index++) {
            if (tokens[index] !== null && tokens[index] !== ''){
              await this.notificationService.sendCancelNotification(tokens[index], data.fullName,
                data.documentId, this.messaging
              )
            }
            else{
              console.log('Null oe empty deviceToken')
            }
          }
        }
        else{
          console.log('No tokens yet')
          return;
        }
      }
      else{
        const usersRef = this.firestore.collection('users');
          const querySnapshot = await usersRef.where('role', 'in', ['officer', 'user']).get();
          if (querySnapshot.empty){
            console.log('no documents found')
            return;
          }
          const targetLocation: Location = {latitude: data.latitude, longitude: data.longitude}
          const nearbyUsers = this.locationService.getNearbyUsers(targetLocation, querySnapshot)
          if (nearbyUsers.length === 0){
            console.log('No nearby 10km users found')
            return;
          }
          const tokens = nearbyUsers
            .map((user: any) => user?.deviceToken)
            .filter((token: string | undefined | null) => token && token !== '');
          if (tokens.length != 0){
            for (let index = 0; index < tokens.length; index++) {
              if (tokens[index] !== null && tokens[index] !== ''){
                await this.notificationService.sendCancelNotification(tokens[index], data.fullName,
                  data.documentId, this.messaging
                )
              }
              else{
                console.log('Null or empty deviceToken')
              }
            }
          }
      }
      
    } catch (error) {
      console.log(error)
    }
  }
}
