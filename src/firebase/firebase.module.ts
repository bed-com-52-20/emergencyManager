import { Global, Module } from "@nestjs/common";
import { FirebaseService } from "./firebase.service";
import { FirebaseController } from "./firebase.controller";
import { LocationService } from "./location.service";
import { NotificationService } from "./notification.service";
import { BroadCastService } from "src/broadcast/broadcast.service";
 

@Global()
@Module({
  imports: [],
  providers: [FirebaseService, LocationService, NotificationService, BroadCastService],
  controllers: [FirebaseController],
  exports: [FirebaseService]
})
export class FirebaseModule {}