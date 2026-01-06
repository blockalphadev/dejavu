/**
 * Domain Error Base Class
 *
 * Base class for all domain-specific errors with structured error codes.
 */

/**
 * Error severity level
 */
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Error category
 */
export type ErrorCategory =
    | 'validation'
    | 'authentication'
    | 'authorization'
    | 'business_rule'
    | 'not_found'
    | 'conflict'
    | 'external_service'
    | 'infrastructure'
    | 'unknown';

/**
 * Base domain error class
 */
export abstract class DomainError extends Error {
    abstract readonly code: string;
    abstract readonly category: ErrorCategory;
    readonly severity: ErrorSeverity;
    readonly timestamp: Date;
    readonly details?: Record<string, unknown>;

    constructor(
        message: string,
        options?: {
            severity?: ErrorSeverity;
            details?: Record<string, unknown>;
            cause?: Error;
        },
    ) {
        super(message, { cause: options?.cause });
        this.name = this.constructor.name;
        this.severity = options?.severity ?? 'medium';
        this.timestamp = new Date();
        this.details = options?.details;

        // Maintains proper stack trace for where error was thrown
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }

    /**
     * Convert to plain object for serialization
     */
    toJSON() {
        return {
            name: this.name,
            code: this.code,
            message: this.message,
            category: this.category,
            severity: this.severity,
            timestamp: this.timestamp.toISOString(),
            details: this.details,
            stack: this.stack,
        };
    }
}

/**
 * Validation error - for input validation failures
 */
export class ValidationError extends DomainError {
    readonly code = 'VALIDATION_ERROR';
    readonly category = 'validation' as const;
    readonly field?: string;

    constructor(
        message: string,
        options?: {
            field?: string;
            details?: Record<string, unknown>;
        },
    ) {
        super(message, { severity: 'low', details: options?.details });
        this.field = options?.field;
    }
}

/**
 * Authentication error - for auth failures
 */
export class AuthenticationError extends DomainError {
    readonly code = 'AUTHENTICATION_ERROR';
    readonly category = 'authentication' as const;

    constructor(message = 'Authentication required') {
        super(message, { severity: 'medium' });
    }
}

/**
 * Authorization error - for permission failures
 */
export class AuthorizationError extends DomainError {
    readonly code = 'AUTHORIZATION_ERROR';
    readonly category = 'authorization' as const;
    readonly requiredPermission?: string;

    constructor(
        message = 'Insufficient permissions',
        options?: { requiredPermission?: string },
    ) {
        super(message, { severity: 'medium' });
        this.requiredPermission = options?.requiredPermission;
    }
}

/**
 * Not found error - for resource not found
 */
export class NotFoundError extends DomainError {
    readonly code = 'NOT_FOUND';
    readonly category = 'not_found' as const;
    readonly resourceType: string;
    readonly resourceId?: string;

    constructor(
        resourceType: string,
        resourceId?: string,
    ) {
        const message = resourceId
            ? `${resourceType} with ID '${resourceId}' not found`
            : `${resourceType} not found`;
        super(message, { severity: 'low', details: { resourceType, resourceId } });
        this.resourceType = resourceType;
        this.resourceId = resourceId;
    }
}

/**
 * Conflict error - for duplicate/conflict situations
 */
export class ConflictError extends DomainError {
    readonly code = 'CONFLICT';
    readonly category = 'conflict' as const;

    constructor(
        message: string,
        details?: Record<string, unknown>,
    ) {
        super(message, { severity: 'low', details });
    }
}

/**
 * Business rule error - for domain logic violations
 */
export class BusinessRuleError extends DomainError {
    readonly code: string;
    readonly category = 'business_rule' as const;

    constructor(
        code: string,
        message: string,
        options?: {
            severity?: ErrorSeverity;
            details?: Record<string, unknown>;
        },
    ) {
        super(message, options);
        this.code = code;
    }
}

/**
 * External service error - for third-party service failures
 */
export class ExternalServiceError extends DomainError {
    readonly code = 'EXTERNAL_SERVICE_ERROR';
    readonly category = 'external_service' as const;
    readonly serviceName: string;

    constructor(
        serviceName: string,
        message: string,
        cause?: Error,
    ) {
        super(message, { severity: 'high', cause, details: { serviceName } });
        this.serviceName = serviceName;
    }
}

/**
 * Infrastructure error - for system/infra failures
 */
export class InfrastructureError extends DomainError {
    readonly code = 'INFRASTRUCTURE_ERROR';
    readonly category = 'infrastructure' as const;

    constructor(
        message: string,
        cause?: Error,
    ) {
        super(message, { severity: 'critical', cause });
    }
}
