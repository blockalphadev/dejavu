import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';

export interface WalletAddress {
    address: string;
    chain: string;
    isPrimary: boolean;
}

export interface Profile {
    id: string;
    email: string | null;
    full_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    preferences: Record<string, any>;
    wallet_addresses: WalletAddress[];
    created_at: string;
    updated_at: string;
}

export interface ProfileInsert {
    id: string;
    email?: string | null;
    full_name?: string | null;
    avatar_url?: string | null;
    bio?: string | null;
    preferences?: Record<string, any>;
    wallet_addresses?: WalletAddress[];
}

export interface ProfileUpdate {
    email?: string | null;
    full_name?: string | null;
    avatar_url?: string | null;
    bio?: string | null;
    preferences?: Record<string, any>;
    wallet_addresses?: WalletAddress[];
}

export interface MulterFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    buffer: Buffer;
    size: number;
}

/**
 * Users Service
 * Manages user profiles and wallet addresses
 */
@Injectable()
export class UsersService {
    private readonly logger = new Logger(UsersService.name);

    constructor(private readonly supabaseService: SupabaseService) { }

    /**
     * Find user by ID
     */
    async findById(id: string): Promise<Profile | null> {
        const supabase = this.supabaseService.getAdminClient();
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null; // Not found
            this.logger.error(`Failed to find user: ${error.message}`);
            return null;
        }

        return data as Profile;
    }

    /**
     * Find user by email
     */
    async findByEmail(email: string): Promise<Profile | null> {
        const supabase = this.supabaseService.getAdminClient();
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', email)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null; // Not found
            this.logger.error(`Failed to find user by email: ${error.message}`);
            return null;
        }

        return data as Profile;
    }

    /**
     * Find user by wallet address
     */
    async findByWalletAddress(address: string, chain: string): Promise<Profile | null> {
        const supabase = this.supabaseService.getAdminClient();

        // First check wallet_addresses table
        const { data: walletData, error: walletError } = await supabase
            .from('wallet_addresses')
            .select('user_id')
            .eq('address', address.toLowerCase())
            .eq('chain', chain)
            .single();

        if (walletError || !walletData) {
            // Try profiles table JSONB field as fallback
            const { data: profiles, error: profileError } = await supabase
                .from('profiles')
                .select('*');

            if (profileError || !profiles) return null;

            // Search in wallet_addresses JSONB array
            const found = (profiles as Profile[]).find((p) =>
                p.wallet_addresses?.some(
                    (w) => w.address.toLowerCase() === address.toLowerCase() && w.chain === chain
                )
            );

            return found || null;
        }

        return this.findById((walletData as { user_id: string }).user_id);
    }

    /**
     * Create user profile
     */
    async createProfile(profile: ProfileInsert): Promise<Profile> {
        const supabase = this.supabaseService.getAdminClient();
        const { data, error } = await supabase
            .from('profiles')
            .insert({
                id: profile.id,
                email: profile.email,
                full_name: profile.full_name,
                avatar_url: profile.avatar_url,
                bio: profile.bio,
                preferences: profile.preferences || {},
                wallet_addresses: profile.wallet_addresses || [],
            })
            .select()
            .single();

        if (error) {
            this.logger.error(`Failed to create profile: ${error.message}`);
            throw new Error(`Failed to create profile: ${error.message}`);
        }

        this.logger.log(`Profile created: ${profile.id}`);
        return data as Profile;
    }

    /**
     * Update user profile
     */
    async updateProfile(id: string, update: ProfileUpdate): Promise<Profile> {
        const supabase = this.supabaseService.getAdminClient();
        const { data, error } = await supabase
            .from('profiles')
            .update({ ...update, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            this.logger.error(`Failed to update profile: ${error.message}`);
            throw new NotFoundException('Profile not found');
        }

        return data as Profile;
    }

    /**
     * Add wallet address to user
     */
    async addWalletAddress(
        userId: string,
        address: string,
        chain: 'ethereum' | 'solana' | 'sui' | 'base',
        isPrimary = false,
    ): Promise<void> {
        const supabase = this.supabaseService.getAdminClient();

        // Check if this is the first wallet (make it primary)
        const { data: existingWallets } = await supabase
            .from('wallet_addresses')
            .select('id')
            .eq('user_id', userId);

        const shouldBePrimary = isPrimary || !(existingWallets as any[])?.length;

        // If making primary, unset other primary wallets
        if (shouldBePrimary) {
            await supabase
                .from('wallet_addresses')
                .update({ is_primary: false })
                .eq('user_id', userId);
        }

        // Insert new wallet
        const { error } = await supabase.from('wallet_addresses').insert({
            user_id: userId,
            address: address.toLowerCase(),
            chain,
            is_primary: shouldBePrimary,
        });

        if (error) {
            // Might already exist, that's okay
            if (!error.message.includes('duplicate')) {
                this.logger.error(`Failed to add wallet: ${error.message}`);
            }
        }

        // Also update JSONB in profiles for quick lookups
        const profile = await this.findById(userId);
        if (profile) {
            const wallets = profile.wallet_addresses || [];
            const exists = wallets.some(
                (w) => w.address.toLowerCase() === address.toLowerCase() && w.chain === chain
            );

            if (!exists) {
                wallets.push({ address: address.toLowerCase(), chain, isPrimary: shouldBePrimary });
                await this.updateProfile(userId, { wallet_addresses: wallets });
            }
        }
    }

    /**
     * Remove wallet address
     */
    async removeWalletAddress(userId: string, address: string, chain: string): Promise<void> {
        const supabase = this.supabaseService.getAdminClient();

        await supabase
            .from('wallet_addresses')
            .delete()
            .eq('user_id', userId)
            .eq('address', address.toLowerCase())
            .eq('chain', chain);

        // Update profiles JSONB
        const profile = await this.findById(userId);
        if (profile) {
            const wallets = profile.wallet_addresses?.filter(
                (w) => !(w.address.toLowerCase() === address.toLowerCase() && w.chain === chain)
            );
            await this.updateProfile(userId, { wallet_addresses: wallets });
        }
    }

    /**
     * Get user's wallet addresses
     */
    async getWalletAddresses(userId: string) {
        const supabase = this.supabaseService.getAdminClient();
        const { data, error } = await supabase
            .from('wallet_addresses')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: true });

        if (error) {
            this.logger.error(`Failed to get wallets: ${error.message}`);
            return [];
        }

        return data as Array<{
            id: string;
            user_id: string;
            address: string;
            chain: string;
            is_primary: boolean;
            created_at: string;
        }>;
    }

    /**
     * Upload user avatar
     */
    async uploadAvatar(userId: string, file: MulterFile): Promise<string> {
        const supabase = this.supabaseService.getAdminClient();
        const fileExt = file.originalname.split('.').pop();
        const fileName = `${userId}/${Date.now()}.${fileExt}`;

        const { error } = await supabase.storage
            .from('avatars')
            .upload(fileName, file.buffer, {
                contentType: file.mimetype,
                upsert: true,
            });

        if (error) {
            this.logger.error(`Failed to upload avatar: ${error.message}`);
            throw new Error(`Failed to upload avatar: ${error.message}`);
        }

        const { data } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);

        // Update profile with new avatar URL
        await this.updateProfile(userId, { avatar_url: data.publicUrl });

        return data.publicUrl;
    }
}
