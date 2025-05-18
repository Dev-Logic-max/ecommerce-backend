import { Injectable, OnModuleInit, OnModuleDestroy, INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

// import { PrismaClient } from '../prisma/generated/prisma'; // Custom path

@Injectable()
// export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
//     async onModuleInit() {
//         await this.$connect();
//         console.log("✅ Prisma connected successfully");
//     }

//     async onModuleDestroy() {
//         await this.$disconnect();
//         console.log("✅ Prisma disconnected successfully");
//     }
// }

export class PrismaService extends PrismaClient implements OnModuleInit {
    async onModuleInit() {
        await this.$connect();
        console.log("✅ Prisma connected successfully");
    }

    async enableShutdownHooks(app: INestApplication) {
        // this.$on('beforeExit' as any, async () => {});
        (this.$on as any)('beforeExit', async () => {
            await app.close();
            console.log("✅ Prisma connection closed successfully");
        });
    }
}