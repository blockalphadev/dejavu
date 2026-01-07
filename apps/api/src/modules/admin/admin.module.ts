import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller.js';
import { AdminService } from './admin.service.js';
import { AdminGuard, SuperAdminGuard } from './guards/index.js';
import { DatabaseModule } from '../../database/database.module.js';

@Module({
    imports: [DatabaseModule],
    controllers: [AdminController],
    providers: [
        AdminService,
        AdminGuard,
        SuperAdminGuard,
    ],
    exports: [AdminService, AdminGuard, SuperAdminGuard],
})
export class AdminModule { }
