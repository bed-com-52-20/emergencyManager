import { Global, Module } from "@nestjs/common";
import { FirebaseService } from "./firebase.service";
import { FirebaseController } from "./firebase.controller";
 

@Global()
@Module({
  imports: [],
  providers: [FirebaseService],
  controllers: [FirebaseController],
  exports: [FirebaseService]
})
export class FirebaseModule {}