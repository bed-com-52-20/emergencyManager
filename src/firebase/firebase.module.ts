import { Global, Module } from "@nestjs/common";
import { FirebaseService } from "./firebase.service";
import { FirebaseController } from "./firebase.controller";
import { LocationService } from "./location.service";
 

@Global()
@Module({
  imports: [],
  providers: [FirebaseService, LocationService],
  controllers: [FirebaseController],
  exports: [FirebaseService]
})
export class FirebaseModule {}