import { Body, Controller, HttpException, HttpStatus, Post } from "@nestjs/common";
import { BroadcastToAllData } from "src/dto/dto";
import { BroadCastService } from "./broadcast.service";

@Controller('broadcast')
export class BroadcastController{
    constructor(private readonly broadcastService: BroadCastService){}

    @Post('all')
    async broadcastToAllUsers(@Body() data: BroadcastToAllData){
        try {
            return await this.broadcastService.broadCast(data, 'all')
        } catch (error) {
            throw new HttpException('Operation failed', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Post('officers')
    async broadcastToOfficers(@Body() data: BroadcastToAllData){
        try {
            return await this.broadcastService.broadCast(data, 'officers')
        } catch (error) {
            throw new HttpException('Operation failed', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}