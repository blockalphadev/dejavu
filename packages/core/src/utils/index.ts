/**
 * @dejavu/core - Utility Functions
 * 
 * Shared utility functions used across the DeJaVu platform.
 */

// ============================================================================
// Formatting Utilities
// ============================================================================

/**
 * Format a number as currency
 */
export function formatCurrency(
    value: number,
    currency: string = 'USD',
    locale: string = 'en-US'
): string {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
}

/**
 * Format a number with compact notation (e.g., 1.2K, 3.4M)
 */
export function formatCompactNumber(
    value: number,
    locale: string = 'en-US'
): string {
    return new Intl.NumberFormat(locale, {
        notation: 'compact',
        maximumFractionDigits: 1,
    }).format(value);
}

/**
 * Format a percentage value
 */
export function formatPercentage(
    value: number,
    decimals: number = 1
): string {
    return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format a crypto amount with appropriate decimals
 */
export function formatCryptoAmount(
    value: number | bigint,
    decimals: number = 18,
    displayDecimals: number = 4
): string {
    const divisor = BigInt(10 ** decimals);
    const bigValue = typeof value === 'bigint' ? value : BigInt(Math.floor(value));
    const wholePart = bigValue / divisor;
    const fractionalPart = bigValue % divisor;

    const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
    const trimmedFractional = fractionalStr.slice(0, displayDecimals);

    if (parseInt(trimmedFractional) === 0) {
        return wholePart.toString();
    }

    return `${wholePart}.${trimmedFractional.replace(/0+$/, '')}`;
}

// ============================================================================
// Date Utilities
// ============================================================================

/**
 * Format a date to relative time (e.g., "2 hours ago", "in 3 days")
 */
export function formatRelativeTime(date: Date, locale: string = 'en-US'): string {
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffSecs = Math.round(diffMs / 1000);
    const diffMins = Math.round(diffSecs / 60);
    const diffHours = Math.round(diffMins / 60);
    const diffDays = Math.round(diffHours / 24);

    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

    if (Math.abs(diffSecs) < 60) {
        return rtf.format(diffSecs, 'second');
    } else if (Math.abs(diffMins) < 60) {
        return rtf.format(diffMins, 'minute');
    } else if (Math.abs(diffHours) < 24) {
        return rtf.format(diffHours, 'hour');
    } else if (Math.abs(diffDays) < 30) {
        return rtf.format(diffDays, 'day');
    } else {
        return date.toLocaleDateString(locale);
    }
}

/**
 * Format a date to a short format (e.g., "Jan 5", "Dec 25, 2024")
 */
export function formatShortDate(date: Date, locale: string = 'en-US'): string {
    const now = new Date();
    const sameYear = date.getFullYear() === now.getFullYear();

    return date.toLocaleDateString(locale, {
        month: 'short',
        day: 'numeric',
        ...(sameYear ? {} : { year: 'numeric' }),
    });
}

// ============================================================================
// Address Utilities
// ============================================================================

/**
 * Truncate an address for display (e.g., "0x1234...5678")
 */
export function truncateAddress(
    address: string,
    startLength: number = 6,
    endLength: number = 4
): string {
    if (address.length <= startLength + endLength) {
        return address;
    }
    return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
}

/**
 * Check if a string is a valid EVM address
 */
export function isValidEvmAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Check if a string is a valid Solana address
 */
export function isValidSolanaAddress(address: string): boolean {
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
}

/**
 * Check if a string is a valid Sui address
 */
export function isValidSuiAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{64}$/.test(address);
}

// ============================================================================
// Async Utilities
// ============================================================================

/**
 * Sleep for a given number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry an async function with exponential backoff
 */
export async function retry<T>(
    fn: () => Promise<T>,
    options: {
        maxRetries?: number;
        baseDelayMs?: number;
        maxDelayMs?: number;
    } = {}
): Promise<T> {
    const { maxRetries = 3, baseDelayMs = 1000, maxDelayMs = 10000 } = options;

    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error as Error;

            if (attempt < maxRetries) {
                const delay = Math.min(baseDelayMs * 2 ** attempt, maxDelayMs);
                await sleep(delay);
            }
        }
    }

    throw lastError;
}

/**
 * Debounce a function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
    fn: T,
    delayMs: number
): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    return (...args: Parameters<T>) => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => fn(...args), delayMs);
    };
}

/**
 * Throttle a function
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
    fn: T,
    limitMs: number
): (...args: Parameters<T>) => void {
    let lastRun = 0;

    return (...args: Parameters<T>) => {
        const now = Date.now();
        if (now - lastRun >= limitMs) {
            lastRun = now;
            fn(...args);
        }
    };
}

// ============================================================================
// Object Utilities
// ============================================================================

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Check if a value is empty (null, undefined, empty string, empty array, empty object)
 */
export function isEmpty(value: unknown): boolean {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
}

/**
 * Pick specific keys from an object
 */
export function pick<T extends object, K extends keyof T>(
    obj: T,
    keys: K[]
): Pick<T, K> {
    const result = {} as Pick<T, K>;
    for (const key of keys) {
        if (key in obj) {
            result[key] = obj[key];
        }
    }
    return result;
}

/**
 * Omit specific keys from an object
 */
export function omit<T extends object, K extends keyof T>(
    obj: T,
    keys: K[]
): Omit<T, K> {
    const result = { ...obj };
    for (const key of keys) {
        delete result[key];
    }
    return result as Omit<T, K>;
}
