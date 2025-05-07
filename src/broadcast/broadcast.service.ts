import { Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";
import { BroadcastToAllData, RequestData } from "src/dto/dto";
import * as admin from 'firebase-admin';
import { GeoPoint } from '@google-cloud/firestore';

@Injectable()
export class BroadCastService{
    constructor(private readonly configService: ConfigService){}

    async broadCast(data: BroadcastToAllData, target: string){
        try {
            const usersRef = admin.firestore().collection('users');
            const querySnapshot = target == 'all' 
                ? await usersRef.where('currentDistrict', '==', data.origin).get()
                : await usersRef.where('role', '==', 'officer')
                    .where('currentDistrict', '==', data.origin).get();
            if (querySnapshot.empty){
                console.log('no documents found')
                throw new NotFoundException('No officers registered')
            }
            const phoneNumbers = querySnapshot.docs
                .map((doc: any) => doc.data()?.phone)
                .filter((phone: string | undefined | null) => phone && phone.trim() !== '');
            console.log(phoneNumbers.length)
            console.log(phoneNumbers[0])
            console.log(phoneNumbers[1])
            const formattedNumbers = this.getFormattedPhoneNumber(phoneNumbers)
            if (formattedNumbers.length != 0){
                for (const phoneNumber of formattedNumbers){
                    await this.sendSMS(data.message, phoneNumber)
                }
                const documentRef = admin.firestore().collection('broadcasts').doc();
                await documentRef.set({id: documentRef.id, 
                    broadcastType: target == 'all' ? 'toAll' : 'toOfficers', 
                    date: admin.firestore.Timestamp.fromDate(new Date(data.sentAt)),
                    origin: data.origin, senderId: data.senderId, senderName: data.senderName,
                    senderLocation: new GeoPoint(data.latitude, data.longitude),
                })
            }
            else{
                console.log('No phoneNumbers')
            }
        } catch (error) {
            try {
                throw new error
            } catch (error00) {
                console.log(error00)
            }
            console.log(error)
        }
    }


    async sendSMS(message: string, phoneNumber: string){
        try {
            const apiKey = await this.configService.get('SMS_API_KEY')
            const password = await this.configService.get('PASSWORD')
            const smsUrl = await this.configService.get('SMS_URL')
            const from = await this.configService.get('SMS_FROM')
            const requestData: RequestData = {
                api_key: apiKey, password: password, text: message, numbers: phoneNumber, from: from,
            };

            axios.post(smsUrl, requestData)
                .then((response) => {
                if (response.status === 200) {
                  console.log(response.data);
                } else {
                  console.log(response.statusText);
                }
              })
              .catch((error) => {
                console.error(error);
              });
        } catch (error0) {
            console.log(error0)
        }
    }

    getFormattedPhoneNumber(numbers: string[]){
        console.log('inside')
        let toReturn: string[] = [];
        for(const number of numbers){
            number.trim()
            let cleanedNumber = number
            if (cleanedNumber.startsWith('265')) {
                cleanedNumber = '0' + cleanedNumber.substring(3);
                console.log('first')
            }
            else if (cleanedNumber.startsWith('+265')) {
                cleanedNumber = '0' + cleanedNumber.substring(4);
                console.log('second')
            }
            if (cleanedNumber.startsWith('0') && (cleanedNumber[1] === '8' || cleanedNumber[1] === '9')
                && cleanedNumber.length === 10) {
                toReturn.push(cleanedNumber);
                console.log('pushed')
            }   
        }
        return toReturn
    }
}