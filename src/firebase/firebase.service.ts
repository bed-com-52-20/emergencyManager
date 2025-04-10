// firebase.service.ts
import * as admin from 'firebase-admin';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { EmergencyData } from 'src/dto/dto';
import { GeoPoint } from '@google-cloud/firestore';

@Injectable()
export class FirebaseService implements OnModuleInit {
  onModuleInit() {
    admin.initializeApp({
      credential: admin.credential.cert(require(
        '/home/unimathe/emergency/communitysafetyapplication1-firebase-adminsdk-fbsvc-937f53ad15.json'
        // 'C:/Users/HP/Desktop/safety/emergency/communitysafetyapplication1-firebase-adminsdk-fbsvc-937f53ad15.json'
      ) as admin.ServiceAccount),
    });
  }
//   

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
          responderId: "", triggerId: userData.triggerId, triggeredAt: userData.triggeredAt, type: userData.type
         });

        const usersRef = this.firestore.collection('users');
        const querySnapshot = await usersRef.where('role', '==', 'officer').get();
        if (!querySnapshot.empty){
            const tokens = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return data.deviceToken;
            });
            if (tokens.length != 0){
                const userProfile = await usersRef.doc(userData.triggerId).get()
                if (userProfile.exists){
                    const fullName = userProfile.data()?.fullName
                    const emergenciesRef = this.firestore.collection('emergencies');
                    const occurrences = (await emergenciesRef.where('type', '==', userData.type).get()).size;
                    for (let index = 0; index < tokens.length; index++) {
                        await this.sendNotification(userData, tokens[index], fullName, occurrences);
                    }
                }
                
            }
            else{
              console.log('No tokens yet')
            }
        }
        else{
          console.log('No officers')
        }
    } catch (error) {
        console.log(error)
    }
  }

  async triggerCommunityAlarm(userData: EmergencyData){
    try {
        const documentRef = this.firestore.collection('emergencies').doc()
        await documentRef.set({ id: documentRef.id, photoUri: "", 
          location: new GeoPoint(userData.latitude, userData.longitude ),
          responderId: "", triggerId: userData.triggerId, triggeredAt: userData.triggeredAt, type: userData.type
         });

        const usersRef = this.firestore.collection('users');
        const querySnapshot = await usersRef.where('role', '==', 'officer').where('role', '==', 'user').get();
        if (!querySnapshot.empty){
            const tokens = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return data.deviceToken;
            });
            if (tokens.length != 0){
                const userProfile = await usersRef.doc(userData.triggerId).get()
                if (userProfile.exists){
                    const fullName = userProfile.data()?.fullName
                    const emergenciesRef = this.firestore.collection('emergencies');
                    const occurrences = (await emergenciesRef.where('type', '==', userData.type).get()).size;
                    for (let index = 0; index < tokens.length; index++) {
                        await this.sendNotification(userData, tokens[index], fullName, occurrences);
                    }
                }
            }
            else{
              console.log('No tokens yet')
            }
        }
        else{
          console.log('No officers')
        }
    } catch (error) {
        console.log(error)
    }
  }

  async sendNotification(userData: EmergencyData, deviceToken: string, fullName: string, occurrences: number){
    const message = {
        token: deviceToken, 
        notification: {
          title: `${userData.type} emergency`,
          body: `Location: ${new GeoPoint(userData.latitude, userData.longitude)}`,
        },
        data: {
          victim: fullName,
          occurrences: `${occurrences} times this year`
        },
      };
      console.log('sending message')
      const response = await this.messaging.send(message);
  
      return { message: 'Notification sent', fcmResponse: response };
  }
}
