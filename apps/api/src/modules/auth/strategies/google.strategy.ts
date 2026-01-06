import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    private readonly logger = new Logger(GoogleStrategy.name);

    constructor(private readonly configService: ConfigService) {
        super({
            clientID: configService.get<string>('GOOGLE_CLIENT_ID'),
            clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET'),
            callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL'),
            scope: ['email', 'profile'],
        });
    }

    async validate(
        accessToken: string,
        refreshToken: string,
        profile: Profile,
        done: VerifyCallback,
    ): Promise<void> {
        const { id, emails, displayName, photos } = profile;

        const email = emails?.[0]?.value;
        const avatar = photos?.[0]?.value;

        if (!email) {
            this.logger.warn(`Google OAuth: No email found for profile ${id}`);
            return done(new Error('No email found in Google profile'), undefined);
        }

        const user = {
            googleId: id,
            email,
            fullName: displayName,
            avatarUrl: avatar,
            accessToken,
        };

        this.logger.log(`Google OAuth: Successfully authenticated ${email}`);
        done(null, user);
    }
}
