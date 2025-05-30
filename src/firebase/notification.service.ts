import { EmergencyData } from "src/dto/dto";
import * as admin from 'firebase-admin';
import { Injectable } from "@nestjs/common";

@Injectable()
export class NotificationService{
    constructor(){}
    
    async sendResponseNotification(deviceToken: string, responderName: string,
        messaging: admin.messaging.Messaging,
    ){
        try {
          const message = {
            token: deviceToken, 
            notification: {
              title: 'Emergency response',
              body: `Responder Name: ${responderName}`,
            },
            data: {
              notificationType: 'response'
            },
          };
          console.log('sending message')
          const response = await messaging.send(message);
          console.log('message sent')
          return { message: 'Notification sent', fcmResponse: response };
        } catch (error) {
          console.log(error)
        }
      }

      async sendNotification(userData: EmergencyData, deviceToken: string, fullName: string, 
          occurrences: number, documentId: string, messaging: admin.messaging.Messaging,
          triggerType: string
        ){
          try {
            const message = {
              token: deviceToken, 
              notification: {
                title: `${userData.type}`,
                body: `Occurences: ${occurrences} times`,
              },
              data: {
                documentId: documentId,
                victim: fullName,
                triggerType: triggerType,
                latitude: `${userData.latitude}`,
                longitude: `${userData.longitude}`,
                notificationType: 'newEmergency'
              },
            };
            console.log('sending message')
            const response = await messaging.send(message);
            console.log('message sent')
            return { message: 'Notification sent', fcmResponse: response };
          } catch (error) {
            console.log(error)
          }
        }

        async sendCancelNotification(deviceToken: string, fullName: string, 
            documentId: string, messaging: admin.messaging.Messaging
        ){
          try {
            const message = {
              token: deviceToken, 
              notification: {
                title: `cancelling emergency triggered`,
                body: `Previous trigger: ${fullName}`,
              },
              data: {
                documentId: documentId,
                notificationType: 'cancel'
              },
            };
            console.log('sending message')
            const response = await messaging.send(message);
            console.log('message sent')
            return { message: 'Notification sent', fcmResponse: response };
          } catch (error) {
            console.log(error)
          }
        }
}