import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { CreateAuthDto } from './dto/create-auth.dto';
import { Request, Response } from 'express';
import { RtGuard } from './guards/rt.guard';
import { GoogleOauthGuard } from './guards/google.oauth.guard';

export interface RequestWithUser extends Request {
  user: {
    sub: string;
    email: string;
    refreshToken: string;
  };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  async login(@Body() createAuthDto: CreateAuthDto) {
    return this.authService.login(createAuthDto);
  }

  @Public()
  @Get('logout')
  async logout(@Body('userId') userId: string) {
    return this.authService.logout(userId);
  }

  @UseGuards(RtGuard)
  @Get('refresh')
  @Public()
  refresh(@Query('id') id: string, @Req() req: RequestWithUser) {
    const { user } = req;
    if (user.sub !== id) {
      throw new UnauthorizedException('Invalid User');
    }
    return this.authService.refreshTokens(id, user.refreshToken);
  }

  @Public()
  @Get('google')
  @UseGuards(GoogleOauthGuard)
  async googleAuth() {
    // Guard will handle redirection
  }

  // Callback after Google login
// Callback after Google login
@Public()
@Get('google/callback')
@UseGuards(GoogleOauthGuard)
async googleAuthRedirect(@Req() req, @Res() res: Response) {
  const user = req.user;
  if (!user) {
    throw new UnauthorizedException('Google authentication failed');
  }

  const result = await this.authService.googleAuthRedirect(user);
  const { accessToken, refreshToken } = result.tokens;

  // Store tokens in HttpOnly cookies
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: true, // use true in production (requires HTTPS)
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 1, // 1 hour
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  });

  // Redirect safely to the frontend
  return res.redirect('http://localhost:3000/auth/google/callback');
}

}
