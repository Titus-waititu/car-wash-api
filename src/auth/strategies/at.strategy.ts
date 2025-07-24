import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';

export type JWTPayload = {
  sub: string;
  email: string;
  role: string;
  username: string;
};

@Injectable()
export class AtStrategy extends PassportStrategy(Strategy, 'jwt-at') {
  constructor(private readonly configServices: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), //Bearer token extraction from Authorization header
      secretOrKey: configServices.getOrThrow<string>('JWT_ACCESS_TOKEN_SECRET'), //Access token secret key
    });
  }

  validate(payload: JWTPayload) {
    return payload; // Return the payload directly, which contains user information (attach request.user = payload;)
  }
}
