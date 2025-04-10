import { Timestamp } from "rxjs"
// import { GeoPoint } from '@google-cloud/firestore';

export class EmergencyData{
    latitude: number
    longitude: number
    triggerId: string
    triggeredAt: Date
    type: string
}