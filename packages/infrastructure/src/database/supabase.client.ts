/**
 * Supabase Client Factory
 *
 * Creates and manages Supabase client instances.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase configuration
 */
export interface SupabaseConfig {
    /** Supabase project URL */
    url: string;
    /** Supabase anon key (public) */
    anonKey: string;
    /** Service role key (server-side only) */
    serviceRoleKey?: string;
}

/**
 * Create a Supabase client for public operations
 */
export function createSupabaseClient(config: SupabaseConfig): SupabaseClient {
    return createClient(config.url, config.anonKey, {
        auth: {
            autoRefreshToken: true,
            persistSession: false,
            detectSessionInUrl: false,
        },
    });
}

/**
 * Create a Supabase admin client for server-side operations
 *
 * WARNING: This client bypasses Row Level Security.
 * Only use in trusted server-side code.
 */
export function createSupabaseAdminClient(config: SupabaseConfig): SupabaseClient {
    if (!config.serviceRoleKey) {
        throw new Error('Service role key is required for admin client');
    }

    return createClient(config.url, config.serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
            detectSessionInUrl: false,
        },
    });
}

/**
 * Create Supabase client from environment variables
 */
export function createSupabaseClientFromEnv(): SupabaseClient {
    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
        throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required');
    }

    return createSupabaseClient({ url, anonKey });
}

/**
 * Create Supabase admin client from environment variables
 */
export function createSupabaseAdminClientFromEnv(): SupabaseClient {
    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !anonKey) {
        throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required');
    }

    return createSupabaseAdminClient({ url, anonKey, serviceRoleKey });
}

// Singleton instances
let publicClient: SupabaseClient | null = null;
let adminClient: SupabaseClient | null = null;

/**
 * Get or create the default public Supabase client
 */
export function getSupabaseClient(): SupabaseClient {
    if (!publicClient) {
        publicClient = createSupabaseClientFromEnv();
    }
    return publicClient;
}

/**
 * Get or create the default admin Supabase client
 */
export function getSupabaseAdminClient(): SupabaseClient {
    if (!adminClient) {
        adminClient = createSupabaseAdminClientFromEnv();
    }
    return adminClient;
}
