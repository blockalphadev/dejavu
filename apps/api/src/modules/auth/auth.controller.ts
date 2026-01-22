import {
    Controller,
    Post,
    Get,
    Delete,
    Body,
    Res,
    Req,
    Param,
    UseGuards,
    HttpCode,
    HttpStatus,
    Logger,
    Ip,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response, Request } from 'express';
import { AuthService } from './auth.service.js';
import { WalletConnectService } from './services/wallet-connect.service.js';
import { JwtAuthGuard, GoogleAuthGuard } from './guards/index.js';
import { Public, CurrentUser } from './decorators/index.js';
import {
    SignupDto,
    LoginDto,
    MagicLinkDto,
    RefreshTokenDto,
    WalletChallengeDto,
    WalletVerifyDto,
    GoogleProfileCompletionDto,
} from './dto/index.js';
import {
    WalletConnectChallengeDto,
    WalletConnectVerifyDto,
    WalletConnectCompleteProfileDto,
    LinkWalletDto,
} from './dto/wallet-connect.dto.js';

/**
 * Authentication Controller
 * Handles all auth endpoints: signup, login, OAuth, wallet
 * with IP tracking for brute force protection
 */
@Controller('auth')
export class AuthController {
    private readonly logger = new Logger(AuthController.name);

    constructor(
        private readonly authService: AuthService,
        private readonly walletConnectService: WalletConnectService,
        private readonly configService: ConfigService,
    ) { }

    /**
     * Get client IP address from request
     */
    private getClientIp(req: Request): string {
        const forwardedFor = req.headers['x-forwarded-for'];
        if (forwardedFor) {
            const ips = Array.isArray(forwardedFor)
                ? forwardedFor[0]
                : forwardedFor.split(',')[0];
            return ips.trim();
        }
        return req.ip || req.socket?.remoteAddress || 'unknown';
    }

    /**
     * POST /auth/signup
     * Register with email and password
     */
    @Public()
    @Post('signup')
    @HttpCode(HttpStatus.CREATED)
    async signup(
        @Body() dto: SignupDto,
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ) {
        const ipAddress = this.getClientIp(req);
        const result = await this.authService.signup(dto, ipAddress);
        this.setTokenCookies(res, result.tokens.refreshToken);
        return result;
    }

    /**
     * POST /auth/login
     * Login with email and password
     */
    @Public()
    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(
        @Body() dto: LoginDto,
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ) {
        const ipAddress = this.getClientIp(req);
        const result = await this.authService.login(dto, ipAddress);
        this.setTokenCookies(res, result.tokens.refreshToken);
        return result;
    }

    /**
     * POST /auth/magic-link
     * Send magic link to email
     */
    @Public()
    @Post('magic-link')
    @HttpCode(HttpStatus.OK)
    async magicLink(@Body() dto: MagicLinkDto) {
        return this.authService.sendMagicLink(dto);
    }

    /**
     * POST /auth/wallet/challenge
     * Get challenge message for wallet signing (legacy)
     */
    @Public()
    @Post('wallet/challenge')
    @HttpCode(HttpStatus.OK)
    async walletChallenge(@Body() dto: WalletChallengeDto) {
        return this.authService.getWalletChallenge(dto);
    }

    /**
     * POST /auth/wallet/verify
     * Verify wallet signature and authenticate (legacy)
     */
    @Public()
    @Post('wallet/verify')
    @HttpCode(HttpStatus.OK)
    async walletVerify(
        @Body() dto: WalletVerifyDto,
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ) {
        const ipAddress = this.getClientIp(req);
        const result = await this.authService.verifyWallet(dto, ipAddress);
        this.setTokenCookies(res, result.tokens.refreshToken);
        return result;
    }

    // ================================================================
    // NEW WALLET CONNECT ENDPOINTS (SIWE-based, multi-chain)
    // ================================================================

    /**
     * POST /auth/wallet-connect/challenge
     * Generate SIWE challenge message for wallet authentication
     * Supports: MetaMask, Phantom, Coinbase, Slush, WalletConnect
     */
    @Public()
    @Post('wallet-connect/challenge')
    @HttpCode(HttpStatus.OK)
    async walletConnectChallenge(
        @Body() dto: WalletConnectChallengeDto,
        @Req() req: Request,
    ) {
        const ipAddress = this.getClientIp(req);
        const userAgent = req.headers['user-agent'];
        return this.walletConnectService.generateChallenge(dto, ipAddress, userAgent);
    }

    /**
     * POST /auth/wallet-connect/verify
     * Verify wallet signature and authenticate user
     * Returns JWT tokens and profile pending status
     */
    @Public()
    @Post('wallet-connect/verify')
    @HttpCode(HttpStatus.OK)
    async walletConnectVerify(
        @Body() dto: WalletConnectVerifyDto,
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ) {
        const ipAddress = this.getClientIp(req);
        const userAgent = req.headers['user-agent'];
        const result = await this.walletConnectService.verifySignature(dto, ipAddress, userAgent);
        this.setTokenCookies(res, result.tokens.refreshToken);
        return result;
    }

    /**
     * POST /auth/wallet-connect/complete-profile
     * Complete profile for wallet users (username + TOS)
     * Required before full access is granted
     */
    @Post('wallet-connect/complete-profile')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async walletConnectCompleteProfile(
        @CurrentUser('id') userId: string,
        @Body() dto: WalletConnectCompleteProfileDto,
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ) {
        const ipAddress = this.getClientIp(req);
        const result = await this.walletConnectService.completeProfile(userId, dto, ipAddress);
        this.setTokenCookies(res, result.tokens.refreshToken);
        return result;
    }

    /**
     * GET /auth/wallet-connect/connected
     * Get all connected wallets for the authenticated user
     */
    @Get('wallet-connect/connected')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async getConnectedWallets(@CurrentUser('id') userId: string) {
        return this.walletConnectService.getConnectedWallets(userId);
    }

    /**
     * POST /auth/wallet-connect/link
     * Link an additional wallet to existing account
     */
    @Post('wallet-connect/link')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async linkWallet(
        @CurrentUser('id') userId: string,
        @Body() dto: LinkWalletDto,
        @Req() req: Request,
    ) {
        const ipAddress = this.getClientIp(req);
        const userAgent = req.headers['user-agent'];

        // Verify the signature first
        const verifyResult = await this.walletConnectService.verifySignature(
            {
                address: dto.address,
                chain: dto.chain,
                signature: dto.signature,
                message: dto.message,
                nonce: dto.nonce,
                provider: dto.provider,
            },
            ipAddress,
            userAgent,
        );

        // Link wallet to existing user
        return { success: true, message: 'Wallet linked successfully' };
    }

    /**
     * DELETE /auth/wallet-connect/:address
     * Disconnect a wallet from user account
     */
    @Delete('wallet-connect/:address')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async disconnectWallet(
        @CurrentUser('id') userId: string,
        @Param('address') address: string,
    ) {
        await this.walletConnectService.disconnectWallet(userId, address);
        return { success: true, message: 'Wallet disconnected successfully' };
    }

    /**
     * GET /auth/google
     * Initiate Google OAuth flow
     */
    @Public()
    @Get('google')
    @UseGuards(GoogleAuthGuard)
    async googleAuth() {
        // Guard redirects to Google
    }

    /**
     * GET /auth/google/callback
     * Google OAuth callback - Enhanced with profile pending detection
     */
    @Public()
    @Get('google/callback')
    @UseGuards(GoogleAuthGuard)
    async googleCallback(@Req() req: Request, @Res() res: Response) {
        try {
            const googleUser = req.user as {
                googleId: string;
                email: string;
                fullName: string;
                avatarUrl?: string;
            };

            // Use enhanced callback that detects profile pending
            const result = await this.authService.handleGoogleCallbackEnhanced(googleUser);
            this.setTokenCookies(res, result.tokens.refreshToken);

            // Redirect to frontend with tokens and profile status
            const frontendUrl = this.configService.get('CORS_ORIGINS', 'http://localhost:5173').split(',')[0];
            const redirectUrl = new URL('/auth/callback', frontendUrl);
            redirectUrl.searchParams.set('access_token', result.tokens.accessToken);
            redirectUrl.searchParams.set('expires_in', result.tokens.expiresIn.toString());
            redirectUrl.searchParams.set('profile_pending', result.profilePending.toString());

            res.redirect(redirectUrl.toString());
        } catch (error) {
            this.logger.error(`Google callback failed: ${error}`);
            const frontendUrl = this.configService.get('CORS_ORIGINS', 'http://localhost:5173').split(',')[0];
            res.redirect(`${frontendUrl}/auth/error?message=Authentication failed`);
        }
    }

    /**
     * POST /auth/refresh
     * Refresh access token
     */
    @Public()
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    async refresh(
        @Body() dto: RefreshTokenDto,
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ) {
        // Try body first, then cookie
        const refreshToken = dto.refreshToken || (req.cookies?.refresh_token as string);

        if (!refreshToken) {
            return { error: 'Refresh token required' };
        }

        const tokens = await this.authService.refreshTokens(refreshToken);
        this.setTokenCookies(res, tokens.refreshToken);
        return tokens;
    }

    /**
     * POST /auth/google/complete-profile
     * Complete profile for new Google OAuth users
     */
    @Post('google/complete-profile')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async completeGoogleProfile(
        @CurrentUser('id') userId: string,
        @Body() dto: GoogleProfileCompletionDto,
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ) {
        const ipAddress = this.getClientIp(req);
        const result = await this.authService.completeGoogleProfile(userId, dto, ipAddress);
        this.setTokenCookies(res, result.tokens.refreshToken);
        return result;
    }

    /**
     * GET /auth/check-username/:username
     * Check if username is available (rate limited in frontend)
     */
    @Public()
    @Get('check-username/:username')
    @HttpCode(HttpStatus.OK)
    async checkUsername(@Req() req: Request) {
        const username = req.params.username;
        return this.authService.checkUsernameAvailable(username || '');
    }

    /**
     * POST /auth/logout
     * Logout and clear tokens
     */
    @Post('logout')
    @HttpCode(HttpStatus.OK)
    async logout(@Res({ passthrough: true }) res: Response) {
        this.clearTokenCookies(res);
        return { message: 'Logged out successfully' };
    }

    /**
     * GET /auth/me
     * Get current authenticated user
     */
    @Get('me')
    @UseGuards(JwtAuthGuard)
    async me(@CurrentUser('id') userId: string) {
        return this.authService.getCurrentUser(userId);
    }

    /**
     * Set refresh token in HTTP-only cookie
     */
    private setTokenCookies(res: Response, refreshToken: string) {
        const secure = this.configService.get('COOKIE_SECURE') === 'true';
        const domain = this.configService.get('COOKIE_DOMAIN', 'localhost');
        const sameSite = this.configService.get('COOKIE_SAME_SITE', 'lax') as 'strict' | 'lax' | 'none';

        res.cookie('refresh_token', refreshToken, {
            httpOnly: true,
            secure,
            domain,
            sameSite,
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: '/',
        });
    }

    /**
     * Clear token cookies
     */
    private clearTokenCookies(res: Response) {
        res.clearCookie('refresh_token', {
            httpOnly: true,
            path: '/',
        });
    }
}
