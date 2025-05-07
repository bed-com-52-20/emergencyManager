import { Module } from "@nestjs/common";
import { BroadcastController } from "./broadcast.controller";
import { BroadCastService } from "./broadcast.service";
import { FirebaseService } from "src/firebase/firebase.service";
import { LocationService } from "src/firebase/location.service";
import { NotificationService } from "src/firebase/notification.service";

@Module({
    imports: [],
    exports: [],
    controllers: [BroadcastController],
    providers: [BroadCastService, FirebaseService, LocationService, NotificationService]
})
export class BroadcastModule{}