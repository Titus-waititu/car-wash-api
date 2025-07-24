import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Strategy, VerifyCallback } from 'passport-google-oauth2';
import { UserRole } from 'src/types';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {
    super({
      clientID: configService.getOrThrow<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.getOrThrow<string>('GOOGLE_CALLBACK_URL'),
      scope: ['profile', 'email'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, name, emails, photos } = profile;

    // Check if user already exists in DB
    let user = await this.userRepository.findOne({
      where: [{ email: emails[0].value }],
    });

    // Create user if doesn't exist
    if (!user) {
      user = this.userRepository.create({
        email: emails[0].value,
        username: name.givenName || name.familyName,
        role: UserRole.CUSTOMER,
        image_url: photos[0].value,
      });
      await this.userRepository.save(user);
    }

    done(null, {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      image_url: photos[0].value,
      providerId: id,
      provider: 'google',
    });
  }
}
