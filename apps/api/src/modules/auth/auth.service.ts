import {
    Injectable,
    UnauthorizedException,
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { SupabaseService } from '../../database/supabase.service.js';
import { UsersService } from '../users/users.service.js';
import { WalletStrategy } from './strategies/wallet.strategy.js';
import { PasswordValidator } from './validators/index.js';
import {
    SignupDto,
    LoginDto,
    MagicLinkDto,
    WalletChallengeDto,
    WalletVerifyDto,
} from './dto/index.js';

interface TokenPayload {
    sub: string;
    email?: string;
    walletAddress?: string;
    chain?: string;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}

export interface AuthResponse {
    user: {
        id: string;
        email?: string;
        fullName?: string;
        avatarUrl?: string;
        bio?: string;
        walletAddresses?: Array<{ address: string; chain: string }>;
    };
    tokens: AuthTokens;
}

interface LoginAttempt {
    email?: string;
    walletAddress?: string;
    ipAddress: string;
    success: boolean;
    failureReason?: string;
}

/**
 * Authentication Service
 * Handles all authentication logic including email, wallet, and OAuth
 * with brute force protection and security logging
 */
@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);
    private readonly SALT_ROUNDS = 12;
    private readonly challengeStore = new Map<string, { message: string; timestamp: number }>();

    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly supabaseService: SupabaseService,
        private readonly usersService: UsersService,
        private readonly walletStrategy: WalletStrategy,
        private readonly passwordValidator: PasswordValidator,
    ) { }

    /**
     * Register a new user with email and password
     */
    async signup(dto: SignupDto, ipAddress?: string): Promise<AuthResponse> {
        const { email, password, fullName } = dto;

        // Validate password strength
        const passwordValidation = this.passwordValidator.validate(password, email);
        if (!passwordValidation.isValid) {
            throw new BadRequestException({
                message: 'Password does not meet security requirements',
                errors: passwordValidation.errors,
                suggestions: passwordValidation.suggestions,
            });
        }

        // Check if user exists
        const existingUser = await this.usersService.findByEmail(email);
        if (existingUser) {
            throw new ConflictException('Email already registered');
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, this.SALT_ROUNDS);

        // Create user via Supabase Auth
        const supabase = this.supabaseService.getAdminClient();
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirm for development
            user_metadata: { full_name: fullName },
        });

        if (authError || !authData.user) {
            this.logger.error(`Signup failed: ${authError?.message}`);
            throw new BadRequestException(authError?.message || 'Failed to create user');
        }

        // Create profile
        const profile = await this.usersService.createProfile({
            id: authData.user.id,
            email,
            full_name: fullName || null,
            avatar_url: null,
            wallet_addresses: [],
        });

        // Generate tokens
        const tokens = await this.generateTokens({ sub: authData.user.id, email });

        // Log successful signup
        await this.logLoginAttempt({
            email,
            ipAddress: ipAddress || 'unknown',
            success: true,
        });

        this.logger.log(`User registered: ${email}`);

        return {
            user: {
                id: authData.user.id,
                email,
                fullName: profile.full_name || undefined,
                bio: profile.bio || undefined,
            },
            tokens,
        };
    }

    /**
     * Login with email and password
     */
    async login(dto: LoginDto, ipAddress?: string): Promise<AuthResponse> {
        const { email, password } = dto;
        const ip = ipAddress || 'unknown';

        // Check for account lockout
        const isLocked = await this.checkAccountLockout(email, ip);
        if (isLocked) {
            const lockoutDuration = this.configService.get<number>('LOCKOUT_DURATION_MINUTES', 15);
            throw new ForbiddenException(
                `Account temporarily locked due to too many failed attempts. Please try again in ${lockoutDuration} minutes.`
            );
        }

        // Authenticate via Supabase
        const supabase = this.supabaseService.getClient();
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error || !data.user) {
            // Log failed attempt
            await this.logLoginAttempt({
                email,
                ipAddress: ip,
                success: false,
                failureReason: 'Invalid credentials',
            });

            throw new UnauthorizedException('Invalid email or password');
        }

        // Get user profile
        const profile = await this.usersService.findById(data.user.id);

        // Generate tokens
        const tokens = await this.generateTokens({ sub: data.user.id, email });

        // Log successful login
        await this.logLoginAttempt({
            email,
            ipAddress: ip,
            success: true,
        });

        this.logger.log(`User logged in: ${email}`);

        return {
            user: {
                id: data.user.id,
                email: data.user.email,
                fullName: profile?.full_name || undefined,
                avatarUrl: profile?.avatar_url || undefined,
                bio: profile?.bio || undefined,
                walletAddresses: profile?.wallet_addresses?.map((w) => ({
                    address: w.address,
                    chain: w.chain,
                })),
            },
            tokens,
        };
    }

    /**
     * Send magic link email
     */
    async sendMagicLink(dto: MagicLinkDto): Promise<{ message: string }> {
        const { email } = dto;

        const supabase = this.supabaseService.getClient();
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                shouldCreateUser: true,
                emailRedirectTo: `${this.configService.get('CORS_ORIGINS').split(',')[0]}/auth/callback`,
            },
        });

        if (error) {
            this.logger.error(`Magic link failed: ${error.message}`);
            throw new BadRequestException('Failed to send magic link');
        }

        this.logger.log(`Magic link sent to: ${email}`);
        return { message: 'Magic link sent to your email' };
    }

    /**
     * Generate wallet challenge message
     */
    async getWalletChallenge(dto: WalletChallengeDto): Promise<{ message: string; nonce: string }> {
        const { address, chain } = dto;

        const message = this.walletStrategy.generateChallenge(address, chain);
        const nonce = Math.random().toString(36).substring(2, 15);

        // Store challenge with expiry (5 minutes)
        this.challengeStore.set(`${address}:${chain}`, {
            message,
            timestamp: Date.now(),
        });

        // Cleanup old challenges
        this.cleanupChallenges();

        return { message, nonce };
    }

    /**
     * Verify wallet signature and authenticate
     */
    async verifyWallet(dto: WalletVerifyDto, ipAddress?: string): Promise<AuthResponse> {
        const { address, chain, signature, message } = dto;
        const ip = ipAddress || 'unknown';

        // Check for account lockout by wallet address
        const isLocked = await this.checkWalletLockout(address, ip);
        if (isLocked) {
            const lockoutDuration = this.configService.get<number>('LOCKOUT_DURATION_MINUTES', 15);
            throw new ForbiddenException(
                `Wallet temporarily locked due to too many failed attempts. Please try again in ${lockoutDuration} minutes.`
            );
        }

        // Verify the challenge exists and is not expired
        const storedChallenge = this.challengeStore.get(`${address}:${chain}`);
        if (!storedChallenge) {
            await this.logLoginAttempt({
                walletAddress: address,
                ipAddress: ip,
                success: false,
                failureReason: 'Challenge not found',
            });
            throw new BadRequestException('Challenge expired or not found. Please request a new one.');
        }

        // Challenge expires after 5 minutes
        if (Date.now() - storedChallenge.timestamp > 5 * 60 * 1000) {
            this.challengeStore.delete(`${address}:${chain}`);
            await this.logLoginAttempt({
                walletAddress: address,
                ipAddress: ip,
                success: false,
                failureReason: 'Challenge expired',
            });
            throw new BadRequestException('Challenge expired. Please request a new one.');
        }

        // Verify signature
        const verification = await this.walletStrategy.verify(address, signature, message, chain);

        if (!verification.isValid) {
            await this.logLoginAttempt({
                walletAddress: address,
                ipAddress: ip,
                success: false,
                failureReason: verification.error || 'Invalid signature',
            });
            throw new UnauthorizedException(verification.error || 'Invalid signature');
        }

        // Clean up used challenge
        this.challengeStore.delete(`${address}:${chain}`);

        // Find or create user by wallet
        let user = await this.usersService.findByWalletAddress(address, chain);

        if (!user) {
            // Create new user for wallet
            const supabase = this.supabaseService.getAdminClient();
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email: `${address.slice(0, 8)}@wallet.dejavu.app`,
                password: Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2),
                email_confirm: true,
                user_metadata: {
                    wallet_address: address,
                    chain,
                },
            });

            if (authError || !authData.user) {
                throw new BadRequestException('Failed to create wallet user');
            }

            // Create profile with wallet
            await this.usersService.createProfile({
                id: authData.user.id,
                email: null,
                full_name: null,
                avatar_url: null,
                wallet_addresses: [{ address, chain, isPrimary: true }],
            });

            // Add wallet address
            await this.usersService.addWalletAddress(authData.user.id, address, chain);

            user = await this.usersService.findById(authData.user.id);

            this.logger.log(`Wallet user created: ${address} (${chain})`);
        }

        // Log successful wallet auth
        await this.logLoginAttempt({
            walletAddress: address,
            ipAddress: ip,
            success: true,
        });

        // Generate tokens
        const tokens = await this.generateTokens({
            sub: user!.id,
            walletAddress: address,
            chain,
        });

        return {
            user: {
                id: user!.id,
                email: user?.email || undefined,
                fullName: user?.full_name || undefined,
                avatarUrl: user?.avatar_url || undefined,
                bio: user?.bio || undefined,
                walletAddresses: user?.wallet_addresses?.map((w) => ({
                    address: w.address,
                    chain: w.chain,
                })),
            },
            tokens,
        };
    }

    /**
     * Handle Google OAuth callback
     */
    async handleGoogleCallback(googleUser: {
        googleId: string;
        email: string;
        fullName: string;
        avatarUrl?: string;
    }): Promise<AuthResponse> {
        const { googleId, email, fullName, avatarUrl } = googleUser;

        // Find existing user
        let user = await this.usersService.findByEmail(email);

        if (!user) {
            // Create new user
            const supabase = this.supabaseService.getAdminClient();
            const { data: authData, error } = await supabase.auth.admin.createUser({
                email,
                email_confirm: true,
                user_metadata: {
                    full_name: fullName,
                    avatar_url: avatarUrl,
                    google_id: googleId,
                },
            });

            if (error || !authData.user) {
                throw new BadRequestException('Failed to create Google user');
            }

            await this.usersService.createProfile({
                id: authData.user.id,
                email,
                full_name: fullName,
                avatar_url: avatarUrl || null,
                wallet_addresses: [],
            });

            user = await this.usersService.findById(authData.user.id);

            this.logger.log(`Google user created: ${email}`);
        }

        // Generate tokens
        const tokens = await this.generateTokens({ sub: user!.id, email });

        return {
            user: {
                id: user!.id,
                email: user?.email || email,
                fullName: user?.full_name || fullName,
                avatarUrl: user?.avatar_url || avatarUrl,
                bio: user?.bio || undefined,
                walletAddresses: user?.wallet_addresses?.map((w) => ({
                    address: w.address,
                    chain: w.chain,
                })),
            },
            tokens,
        };
    }

    /**
     * Refresh access token
     */
    async refreshTokens(refreshToken: string): Promise<AuthTokens> {
        try {
            const payload = this.jwtService.verify(refreshToken, {
                secret: this.configService.get('JWT_REFRESH_SECRET'),
            });

            // Verify user still exists
            const user = await this.usersService.findById(payload.sub);
            if (!user) {
                throw new UnauthorizedException('User not found');
            }

            // Generate new tokens
            return this.generateTokens({ sub: payload.sub, email: payload.email });
        } catch {
            throw new UnauthorizedException('Invalid refresh token');
        }
    }

    /**
     * Get current user from token payload
     */
    async getCurrentUser(userId: string) {
        const user = await this.usersService.findById(userId);
        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        return {
            id: user.id,
            email: user.email,
            fullName: user.full_name,
            avatarUrl: user.avatar_url,
            bio: user.bio,
            walletAddresses: user.wallet_addresses,
            createdAt: user.created_at,
        };
    }

    /**
     * Check if account is locked due to failed attempts
     */
    private async checkAccountLockout(email: string, ipAddress: string): Promise<boolean> {
        const threshold = this.configService.get<number>('LOCKOUT_THRESHOLD', 5);
        const durationMinutes = this.configService.get<number>('LOCKOUT_DURATION_MINUTES', 15);

        const supabase = this.supabaseService.getAdminClient();

        // Count failed attempts in the lockout window
        const windowStart = new Date(Date.now() - durationMinutes * 60 * 1000).toISOString();
        const { count, error } = await supabase
            .from('login_attempts')
            .select('*', { count: 'exact', head: true })
            .eq('email', email)
            .eq('success', false)
            .gte('attempted_at', windowStart);

        if (error) {
            this.logger.warn(`Failed to check lockout: ${error.message}`);
            return false; // Fail open in case of error
        }

        return (count || 0) >= threshold;
    }

    /**
     * Check if wallet is locked due to failed attempts
     */
    private async checkWalletLockout(walletAddress: string, ipAddress: string): Promise<boolean> {
        const threshold = this.configService.get<number>('LOCKOUT_THRESHOLD', 5);
        const durationMinutes = this.configService.get<number>('LOCKOUT_DURATION_MINUTES', 15);

        const supabase = this.supabaseService.getAdminClient();

        const windowStart = new Date(Date.now() - durationMinutes * 60 * 1000).toISOString();
        const { count, error } = await supabase
            .from('login_attempts')
            .select('*', { count: 'exact', head: true })
            .eq('wallet_address', walletAddress.toLowerCase())
            .eq('success', false)
            .gte('attempted_at', windowStart);

        if (error) {
            this.logger.warn(`Failed to check wallet lockout: ${error.message}`);
            return false;
        }

        return (count || 0) >= threshold;
    }

    /**
     * Log a login attempt
     */
    private async logLoginAttempt(attempt: LoginAttempt): Promise<void> {
        try {
            const supabase = this.supabaseService.getAdminClient();
            await supabase.from('login_attempts').insert({
                email: attempt.email,
                wallet_address: attempt.walletAddress?.toLowerCase(),
                ip_address: attempt.ipAddress,
                success: attempt.success,
                failure_reason: attempt.failureReason,
            });
        } catch (error) {
            // Don't fail the login if logging fails
            this.logger.warn(`Failed to log login attempt: ${error}`);
        }
    }

    /**
     * Generate JWT access and refresh tokens
     */
    private async generateTokens(payload: TokenPayload): Promise<AuthTokens> {
        const expiresIn = this.configService.get('JWT_EXPIRES_IN', '15m');
        const refreshExpiresIn = this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d');

        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: this.configService.get('JWT_SECRET'),
                expiresIn,
            }),
            this.jwtService.signAsync(payload, {
                secret: this.configService.get('JWT_REFRESH_SECRET'),
                expiresIn: refreshExpiresIn,
            }),
        ]);

        // Parse expiresIn to seconds
        const expiresInSeconds = this.parseExpiry(expiresIn);

        return {
            accessToken,
            refreshToken,
            expiresIn: expiresInSeconds,
        };
    }

    /**
     * Parse expiry string to seconds
     */
    private parseExpiry(expiry: string): number {
        const match = expiry.match(/^(\d+)([smhd])$/);
        if (!match) return 900; // default 15 minutes

        const value = parseInt(match[1], 10);
        const unit = match[2];

        switch (unit) {
            case 's':
                return value;
            case 'm':
                return value * 60;
            case 'h':
                return value * 3600;
            case 'd':
                return value * 86400;
            default:
                return 900;
        }
    }

    /**
     * Cleanup expired challenges
     */
    private cleanupChallenges() {
        const now = Date.now();
        const expiry = 5 * 60 * 1000; // 5 minutes

        for (const [key, value] of this.challengeStore.entries()) {
            if (now - value.timestamp > expiry) {
                this.challengeStore.delete(key);
            }
        }
    }

    // ============================================
    // Profile Completion Methods (Google OAuth)
    // ============================================

    /**
     * Check if username is available (with validation)
     * OWASP A03:2021 - Input validation
     */
    async checkUsernameAvailable(username: string): Promise<{
        available: boolean;
        username: string;
        message?: string;
    }> {
        const normalized = username.toLowerCase().trim();

        // Validate format
        if (!this.validateUsernameFormat(normalized)) {
            return {
                available: false,
                username: normalized,
                message: 'Invalid username format. Use 3-30 alphanumeric characters or underscores.',
            };
        }

        // Check reserved usernames
        const reserved = [
            'admin', 'administrator', 'mod', 'moderator', 'support', 'help',
            'dejavu', 'official', 'system', 'root', 'api', 'www', 'mail',
            'bot', 'null', 'undefined', 'anonymous', 'guest', 'test', 'demo',
        ];
        if (reserved.includes(normalized)) {
            return {
                available: false,
                username: normalized,
                message: 'This username is reserved.',
            };
        }

        // Check database
        const supabase = this.supabaseService.getAdminClient();
        const { data, error } = await supabase
            .from('profiles')
            .select('id')
            .ilike('username', normalized)
            .maybeSingle();

        if (error) {
            this.logger.error(`Username check failed: ${error.message}`);
            throw new BadRequestException('Unable to check username availability');
        }

        return {
            available: !data,
            username: normalized,
            message: data ? 'Username already taken' : undefined,
        };
    }

    /**
     * Validate username format
     */
    private validateUsernameFormat(username: string): boolean {
        if (!username || username.length < 3 || username.length > 30) {
            return false;
        }
        // Alphanumeric and underscore, must start with letter
        return /^[a-zA-Z][a-zA-Z0-9_]*$/.test(username);
    }

    /**
     * Complete profile for Google OAuth user
     * Creates Privy embedded wallets after profile completion
     */
    async completeGoogleProfile(
        userId: string,
        dto: {
            username: string;
            fullName?: string;
            agreeToTerms: boolean;
            agreeToPrivacy: boolean;
        },
        ipAddress?: string,
    ): Promise<AuthResponse> {
        const { username, fullName, agreeToTerms, agreeToPrivacy } = dto;

        // Validate terms acceptance
        if (!agreeToTerms || !agreeToPrivacy) {
            throw new BadRequestException('You must agree to Terms of Service and Privacy Policy');
        }

        // Check username availability
        const usernameCheck = await this.checkUsernameAvailable(username);
        if (!usernameCheck.available) {
            throw new BadRequestException(usernameCheck.message || 'Username not available');
        }

        // Get existing user
        const user = await this.usersService.findById(userId);
        if (!user) {
            throw new BadRequestException('User not found');
        }

        // Check if already completed
        if (user.profile_completed) {
            throw new BadRequestException('Profile already completed');
        }

        const supabase = this.supabaseService.getAdminClient();
        const now = new Date().toISOString();

        // Update profile
        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                username: usernameCheck.username,
                full_name: fullName?.trim() || user.full_name,
                agreed_to_terms_at: now,
                agreed_to_privacy_at: now,
                profile_completed: true,
                updated_at: now,
            })
            .eq('id', userId);

        if (updateError) {
            this.logger.error(`Profile completion failed: ${updateError.message}`);
            throw new BadRequestException('Failed to complete profile');
        }

        // Log profile completion
        await this.logLoginAttempt({
            email: user.email ?? undefined,
            ipAddress: ipAddress || 'profile_completion',
            success: true,
        });

        this.logger.log(`Profile completed for user ${userId}: @${usernameCheck.username}`);

        // Refresh user data
        const updatedUser = await this.usersService.findById(userId);

        // Generate new tokens
        const tokens = await this.generateTokens({ sub: userId, email: user.email ?? undefined });

        return {
            user: {
                id: userId,
                email: updatedUser?.email ?? undefined,
                fullName: updatedUser?.full_name ?? fullName ?? undefined,
                avatarUrl: updatedUser?.avatar_url ?? undefined,
                bio: updatedUser?.bio ?? undefined,
                walletAddresses: updatedUser?.wallet_addresses?.map((w) => ({
                    address: w.address,
                    chain: w.chain,
                })),
            },
            tokens,
        };
    }

    /**
     * Generate OAuth state token for CSRF protection
     * OWASP A05:2021 - Security Misconfiguration Prevention
     */
    async generateOAuthState(ipAddress?: string, userAgent?: string): Promise<string> {
        // Generate cryptographically secure random state
        const stateBytes = new Uint8Array(32);
        crypto.getRandomValues(stateBytes);
        const state = Array.from(stateBytes)
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('');

        // Store in database with expiry
        const supabase = this.supabaseService.getAdminClient();
        const { error } = await supabase.from('oauth_state_tokens').insert({
            state_token: state,
            provider: 'google',
            ip_address: ipAddress,
            user_agent: userAgent,
            expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
        });

        if (error) {
            this.logger.error(`Failed to create OAuth state: ${error.message}`);
            throw new BadRequestException('Failed to initiate OAuth flow');
        }

        return state;
    }

    /**
     * Verify OAuth state token (CSRF protection)
     */
    async verifyOAuthState(state: string): Promise<boolean> {
        const supabase = this.supabaseService.getAdminClient();

        // Find and lock the token
        const { data, error } = await supabase
            .from('oauth_state_tokens')
            .select('*')
            .eq('state_token', state)
            .is('used_at', null)
            .gte('expires_at', new Date().toISOString())
            .maybeSingle();

        if (error || !data) {
            this.logger.warn(`Invalid OAuth state token: ${state.substring(0, 10)}...`);
            return false;
        }

        // Mark as used (prevent replay attacks)
        const { error: updateError } = await supabase
            .from('oauth_state_tokens')
            .update({ used_at: new Date().toISOString() })
            .eq('id', data.id);

        if (updateError) {
            this.logger.error(`Failed to mark OAuth state as used: ${updateError.message}`);
        }

        return true;
    }

    /**
     * Enhanced Google callback with profile pending detection
     */
    async handleGoogleCallbackEnhanced(googleUser: {
        googleId: string;
        email: string;
        fullName: string;
        avatarUrl?: string;
    }): Promise<AuthResponse & { profilePending: boolean }> {
        const { googleId, email, fullName, avatarUrl } = googleUser;

        // Check if user exists
        let user = await this.usersService.findByEmail(email);
        let isNewUser = false;

        if (!user) {
            // Create new user
            const supabase = this.supabaseService.getAdminClient();
            const { data: authData, error } = await supabase.auth.admin.createUser({
                email,
                email_confirm: true,
                user_metadata: {
                    full_name: fullName,
                    avatar_url: avatarUrl,
                    google_id: googleId,
                },
            });

            if (error || !authData.user) {
                throw new BadRequestException('Failed to create Google user');
            }

            await this.usersService.createProfile({
                id: authData.user.id,
                email,
                full_name: fullName,
                avatar_url: avatarUrl || null,
                wallet_addresses: [],
            });

            // Set Google ID and auth provider
            await supabase
                .from('profiles')
                .update({
                    google_id: googleId,
                    auth_provider: 'google',
                    profile_completed: false,
                })
                .eq('id', authData.user.id);

            user = await this.usersService.findById(authData.user.id);
            isNewUser = true;

            this.logger.log(`Google user created: ${email}`);
        } else {
            // Update existing user with Google ID if not set
            const supabase = this.supabaseService.getAdminClient();
            if (!user.google_id) {
                await supabase
                    .from('profiles')
                    .update({
                        google_id: googleId,
                        avatar_url: user.avatar_url || avatarUrl,
                    })
                    .eq('id', user.id);
            }
        }

        // Check if profile is complete
        const profilePending = !user?.profile_completed && !user?.username;

        // Generate tokens
        const tokens = await this.generateTokens({ sub: user!.id, email });

        return {
            user: {
                id: user!.id,
                email: user?.email || email,
                fullName: user?.full_name || fullName,
                avatarUrl: user?.avatar_url || avatarUrl,
                bio: user?.bio || undefined,
                walletAddresses: user?.wallet_addresses?.map((w) => ({
                    address: w.address,
                    chain: w.chain,
                })),
            },
            tokens,
            profilePending,
        };
    }
}
