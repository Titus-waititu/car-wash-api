import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateAuthDto } from './dto/create-auth.dto';
import * as Bycrypt from 'bcrypt';


@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

    private async hashData(data: string): Promise<string> {
    const salt = await Bycrypt.genSalt(10);
    return await Bycrypt.hash(data, salt);
  }

  // Helper method to remove password from profile
  private async saveRefreshToken(userId: number, refreshToken: string) {
    const hashedRefreshToken = await this.hashData(refreshToken);
    await this.usersRepository.update(userId, {
      hashedRefreshToken: hashedRefreshToken,
    });
  }

  async getTokens(id: number, email: string, role: string) {
    const [at, rt] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: id,
          email: email,
          role: role,
        },
        {
          secret: this.configService.getOrThrow<string>(
            'JWT_ACCESS_TOKEN_SECRET',
          ),
          expiresIn: this.configService.getOrThrow<string>(
            'JWT_ACCESS_TOKEN_EXPIRATION_TIME',
          ),
        },
      ),
      this.jwtService.signAsync(
        {
          sub: id,
          email: email,
          role: role,
        },
        {
          secret: this.configService.getOrThrow<string>(
            'JWT_REFRESH_TOKEN_SECRET',
          ),
          expiresIn: this.configService.getOrThrow<string>(
            'JWT_REFRESH_TOKEN_EXPIRATION_TIME',
          ),
        },
      ),
    ]);
    return {
        accessToken: at,
        refreshToken: rt,
    }
  }

  async login (createAuthDto:CreateAuthDto){
    const { email,username, password } = createAuthDto;
    const user = await this.usersRepository.findOne({
      where: [
        { email: email },
        { username: username }
      ],
      select: ['id', 'email', 'role', 'password', 'hashedRefreshToken'],
    });

    if (!user) {
      return {
        success: false,
        message: 'Invalid credentials',
      };
    }

   const isPasswordValid = await Bycrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return {
            success: false,
            message: 'Invalid credentials',
        };
        }

    const tokens = await this.getTokens(user.id, user.email, user.role);
    await this.saveRefreshToken(user.id, tokens.refreshToken);
    return {
        success: true,
        message: 'Login successful',
        user: {
            id: user.id,
            email: user.email,
            role: user.role,
        },
        tokens: {
          ...tokens
        }
    };
  }

  async logout(userId: number) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      select: ['id', 'email', 'role', 'hashedRefreshToken'],
    });

    if (!user || !user.hashedRefreshToken) {
      return {
        success: false,
        message: 'User not found or not logged in',
      };
    }

    await this.usersRepository.update(userId, { hashedRefreshToken: null });
    return {
      success: true,
      message: 'Logout successful',
    };

  }

  async refreshTokens(id:number,refreshToken:string){
    const user = await this.usersRepository.findOne({
      where: { id },
      select: ['id', 'email', 'role', 'hashedRefreshToken'],
    });

    if (!user || !user.hashedRefreshToken) {
      return {
        success: false,
        message: 'User not found or not logged in',
      };
    }

    const isRefreshTokenValid = await Bycrypt.compare(refreshToken, user.hashedRefreshToken);
    if (!isRefreshTokenValid) {
      return {
        success: false,
        message: 'Invalid refresh token',
      };
    }

    const tokens = await this.getTokens(user.id, user.email, user.role);
    await this.saveRefreshToken(user.id, tokens.refreshToken);
    return {
      success: true,
      message: 'Tokens refreshed successfully',
      ...tokens,
    };
  }
  
    async googleAuthRedirect(user: any) {
    const { id, email, role } = user;
    const { accessToken, refreshToken } = await this.getTokens(
      id,
      email,
      role,
    );
    return {
      user: {
        id,
        email,
        role,
      },
      tokens:{
        accessToken,
        refreshToken,
      }
    };
  }
}
