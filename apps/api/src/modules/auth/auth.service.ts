import {
    Injectable,
    UnauthorizedException,
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Logger,
    Inject,
    forwardRef,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { SupabaseService } from '../../database/supabase.service.js';
import { UsersService } from '../users/users.service.js';
import { WalletStrategy } from './strategies/wallet.strategy.js';
import { PasswordValidator } from './validators/index.js';
import { DepositService } from '../deposits/deposit.service.js';
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
        @Inject(forwardRef(() => DepositService))
        private readonly depositService: DepositService,
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

        // Ensure Privy wallets exist (generate if not exists)
        await this.ensurePrivyWalletsExist(authData.user.id);

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

        // Ensure Privy wallets exist (generate if not exists)
        await this.ensurePrivyWalletsExist(data.user.id);

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

        // Add wallet address as EXTERNAL wallet (WAJIB disimpan)
        await this.usersService.addWalletAddress(authData.user.id, address, chain, false, 'external');

            user = await this.usersService.findById(authData.user.id);

            this.logger.log(`Wallet user created: ${address} (${chain})`);
        } else {
            // User exists, ensure external wallet is saved
            await this.usersService.addWalletAddress(user.id, address, chain, false, 'external');
        }

        // Ensure Privy wallet exists for all chains (generate if not exists)
        await this.ensurePrivyWalletsExist(user!.id);

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
                walletAddresses: user?.wallet_addresses?.map((w) => ({
                    address: w.address,
                    chain: w.chain,
                })),
            },
            tokens,
        };
    }

    /**
     * Ensure Privy wallets exist for user (generate if not exists)
     * Called after successful login (email or wallet)
     */
    private async ensurePrivyWalletsExist(userId: string): Promise<void> {
        try {
            const chains: Array<'ethereum' | 'base' | 'solana' | 'sui'> = ['ethereum', 'base', 'solana', 'sui'];
            
            for (const chain of chains) {
                try {
                    // Try to get existing Privy wallet
                    const existing = await this.depositService.getPrivyWallet(userId, chain);
                    if (!existing) {
                        // Generate Privy wallet for this chain
                        // Use user ID as privyUserId (will be mapped by DepositService)
                        this.logger.log(`Generating Privy wallet for user ${userId} on ${chain}`);
                        await this.depositService.getOrCreateDepositWallet(userId, chain);
                    }
                } catch (error) {
                    // Log but don't fail - wallet generation can be retried later
                    this.logger.warn(`Failed to ensure Privy wallet for ${chain}: ${error}`);
                }
            }
        } catch (error) {
            // Log but don't fail login process
            this.logger.error(`Failed to ensure Privy wallets: ${error}`);
        }
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
}
