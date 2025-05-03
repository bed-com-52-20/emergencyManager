import { Location } from "src/dto/dto";
import * as admin from 'firebase-admin';

export class LocationService{
    constructor(){}

    private degreesToRadians(degrees: number): number {
        return degrees * (Math.PI / 180);
      }

    private calculateDistance(targetLocation: Location, userLocation: Location): number {
        const earthRadius = 6371; // km
        const latitudesDiffrence = this.degreesToRadians(userLocation.latitude - targetLocation.latitude);
        const longitudeDifference = this.degreesToRadians(userLocation.longitude - targetLocation.longitude);
        const a = Math.sin(latitudesDiffrence / 2) ** 2 + Math.cos(this.degreesToRadians(targetLocation.latitude)) *
            Math.cos(this.degreesToRadians(userLocation.latitude)) * Math.sin(longitudeDifference / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return earthRadius * c;
    }

    getNearbyUsers(targetLocation: Location, 
        usersSnapshot: admin.firestore.QuerySnapshot<admin.firestore.DocumentData, admin.firestore.DocumentData>
    ): any[] {
        const users: any[] = [];
        usersSnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.location?.latitude && data.location?.longitude) {
                users.push({ id: doc.id, ...data });
            }
        });
        
        let radius = 3;
        const maxRadius = 10;
        
        while (radius <= maxRadius) {
          const nearbyUsers = users.filter((user) => {
            const userLocation: Location = {
              latitude: user.location.latitude,
              longitude: user.location.longitude,
            };
            return this.calculateDistance(targetLocation, userLocation) <= radius;
          });
        
          if (nearbyUsers.length > 0) {
            return nearbyUsers;
          }
          radius += 2;
        }
        return []; // No users within 10km        
    }
}