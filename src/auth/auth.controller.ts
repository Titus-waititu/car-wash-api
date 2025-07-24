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
// import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ForgotPasswordDto } from './dto/forgotpassword.dto';
import { ResetPasswordDto } from './dto/resetpassword.dto';

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

    // Optional: include user info (minimized) in redirect
    const frontendURL = new URL('http://localhost:3000/auth/google/callback');
    frontendURL.searchParams.set('accessToken', accessToken);
    frontendURL.searchParams.set('refreshToken', refreshToken);
    frontendURL.searchParams.set('id', result.user.id);
    frontendURL.searchParams.set('role', result.user.role);
    frontendURL.searchParams.set('username', result.user.username);
    frontendURL.searchParams.set('email', result.user.email);
    // Redirect to frontend with tokens and role in URL
    return res.redirect(frontendURL.toString());
  }

  @Get('me')
   getMe(@Req() req: Request) {
    // `req.user` is populated by AtStrategy (global guard)
    if (!req.user) {
      throw new UnauthorizedException('User not authenticated');
    }

    // The JWT payload now contains: { sub, email, role, username }
    return {
      id: req.user['sub'],
      username: req.user['username'],
      email: req.user['email'],
      role: req.user['role'],
    };
  }

  @Post('forgot-password')
  @Public()
  async forgotPassword(
    @Body() forgotPassword: ForgotPasswordDto,
  ): Promise<string> {
    return this.authService.forgotPassword(forgotPassword);
  }

  @Post('reset-password')
  @Public()
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<string> {
    return this.authService.resetPassword(resetPasswordDto);
  }
}
