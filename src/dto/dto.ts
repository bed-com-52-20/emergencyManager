import { Timestamp } from "rxjs"
// import { GeoPoint } from '@google-cloud/firestore';

export class EmergencyData{
    latitude: number
    longitude: number
    triggerId: string
    triggeredAt: Date
    type: string
    sourceDistrict: string
    triggerName: string
}

export class RespondData{
    responderId:string
    id: string
    respondedAt: Date
    triggerId: string
    responderName: string
}

export interface Location{
    latitude: number
    longitude: number
}

export class CancelTriggerData{
    documentId: string
    triggerType: string
    latitude: number
    longitude: number
    fullName: string
}

export interface RequestData {
    api_key: string;
    password: string;
    text: string;
    numbers: string;
    from: string;
  }

  export class BroadcastToAllData{
    message: string
    senderName: string
    sentAt: Date
    senderId: string
    origin: string
    latitude: number
    longitude: number
  }