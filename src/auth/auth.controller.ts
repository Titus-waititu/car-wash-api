import {
  Body,
  Controller,
  Get,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { CreateAuthDto } from './dto/create-auth.dto';
import { Request } from 'express';
import { RtGuard } from './guards/rt.guard';

export interface RequestWithUser extends Request {
  user: {
    sub: number;
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
  async logout(@Body('userId') userId: number) {
    return this.authService.logout(userId);
  }

  @UseGuards(RtGuard)
  @Public()
  @Get('refresh')
  async refresh(
    @Query('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser,
  ) {
    const { user } = req;
    if (user.sub !== id) {
      throw new UnauthorizedException('Invalid User');
    }
    return this.authService.refreshTokens(id, user.refreshToken);
  }
}
