import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    UnauthorizedException,
    Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SupabaseService } from '../../../database/supabase.service.js';

/**
 * AdminGuard
 * 
 * Protects admin routes by verifying:
 * 1. User is authenticated
 * 2. User has admin role in admin_users table
 * 3. Admin account is active
 * 4. (Optional) IP whitelist check
 */
@Injectable()
export class AdminGuard implements CanActivate {
    private readonly logger = new Logger(AdminGuard.name);

    constructor(
        private readonly supabaseService: SupabaseService,
        private readonly reflector: Reflector,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        // Check if user is authenticated
        if (!user || !user.sub) {
            throw new UnauthorizedException('Authentication required');
        }

        try {
            // Check if user is admin
            const { data: adminUser, error } = await this.supabaseService
                .getAdminClient()
                .from('admin_users')
                .select(`
                    id,
                    is_active,
                    mfa_required,
                    mfa_verified,
                    allowed_ips,
                    role:admin_roles (
                        name,
                        permissions,
                        hierarchy_level
                    )
                `)
                .eq('user_id', user.sub)
                .single();

            if (error || !adminUser) {
                this.logger.warn(`Non-admin user attempted admin access: ${user.sub}`);
                throw new ForbiddenException('Admin access required');
            }

            if (!adminUser.is_active) {
                this.logger.warn(`Inactive admin attempted access: ${user.sub}`);
                throw new ForbiddenException('Admin account is inactive');
            }

            // Check MFA if required
            if (adminUser.mfa_required && !adminUser.mfa_verified) {
                throw new ForbiddenException('MFA verification required for admin access');
            }

            // Check IP whitelist if configured
            if (adminUser.allowed_ips && adminUser.allowed_ips.length > 0) {
                const clientIp = request.ip || request.headers['x-forwarded-for'];
                if (!adminUser.allowed_ips.includes(clientIp)) {
                    this.logger.warn(`Admin access from non-whitelisted IP: ${clientIp} for user ${user.sub}`);
                    throw new ForbiddenException('Access denied from this IP address');
                }
            }

            // Attach admin info to request for downstream use
            request.adminUser = {
                id: adminUser.id,
                role: adminUser.role?.name,
                permissions: adminUser.role?.permissions || {},
                hierarchyLevel: adminUser.role?.hierarchy_level || 0,
            };

            // Update last login
            await this.supabaseService
                .getAdminClient()
                .from('admin_users')
                .update({ last_login_at: new Date().toISOString() })
                .eq('id', adminUser.id);

            return true;
        } catch (error) {
            if (error instanceof ForbiddenException || error instanceof UnauthorizedException) {
                throw error;
            }
            this.logger.error(`Admin guard error: ${error.message}`);
            throw new ForbiddenException('Admin verification failed');
        }
    }
}

/**
 * SuperAdminGuard
 * 
 * Extends AdminGuard to require super_admin role specifically
 */
@Injectable()
export class SuperAdminGuard implements CanActivate {
    private readonly logger = new Logger(SuperAdminGuard.name);

    constructor(private readonly adminGuard: AdminGuard) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        // First check basic admin access
        const isAdmin = await this.adminGuard.canActivate(context);
        if (!isAdmin) {
            return false;
        }

        const request = context.switchToHttp().getRequest();
        const adminUser = request.adminUser;

        if (adminUser.role !== 'super_admin') {
            this.logger.warn(`Non-super-admin attempted super-admin action: ${request.user.sub}`);
            throw new ForbiddenException('Super admin access required');
        }

        return true;
    }
}

/**
 * PermissionGuard Factory
 * 
 * Creates a guard that checks for specific permissions
 * Usage: @UseGuards(PermissionGuard('users', 'edit'))
 */
export function PermissionGuard(resource: string, action: string) {
    @Injectable()
    class PermissionGuardMixin implements CanActivate {
        private readonly logger = new Logger('PermissionGuard');

        constructor(private readonly adminGuard: AdminGuard) { }

        async canActivate(context: ExecutionContext): Promise<boolean> {
            const isAdmin = await this.adminGuard.canActivate(context);
            if (!isAdmin) {
                return false;
            }

            const request = context.switchToHttp().getRequest();
            const permissions = request.adminUser?.permissions || {};

            const hasPermission = permissions[resource]?.[action] === true;

            if (!hasPermission) {
                this.logger.warn(
                    `Permission denied: ${resource}.${action} for user ${request.user.sub}`
                );
                throw new ForbiddenException(
                    `Permission denied: requires ${resource}.${action}`
                );
            }

            return true;
        }
    }

    return PermissionGuardMixin;
}
