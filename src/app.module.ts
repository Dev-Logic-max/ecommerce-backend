import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './modules/user/user.module';
import { ConnectionModule } from './modules/connection/connection.module';
import { ShopModule } from './modules/shop/shop.module';
import { WarehouseModule } from './modules/warehouse/warehouse.module';

@Module({
  imports: [
    AuthModule, 
    PrismaModule, 
    UserModule, 
    ConnectionModule,
    ShopModule, 
    WarehouseModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
