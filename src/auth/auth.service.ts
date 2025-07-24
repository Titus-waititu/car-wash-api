import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateAuthDto } from './dto/create-auth.dto';
import * as Bycrypt from 'bcrypt';
import { ForgotPasswordDto } from './dto/forgotpassword.dto';
import { ResetPasswordDto } from './dto/resetpassword.dto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  private async hashData(data: string): Promise<string> {
    const salt = await Bycrypt.genSalt(10);
    return await Bycrypt.hash(data, salt);
  }

  // Helper method to remove password from profile
  private async saveRefreshToken(userId: string, refreshToken: string) {
    const hashedRefreshToken = await this.hashData(refreshToken);
    await this.usersRepository.update(userId, {
      hashedRefreshToken: hashedRefreshToken,
    });
  }

  async getTokens(id: string, email: string, role: string, username: string) {
    const [at, rt] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: id,
          email: email,
          role: role,
          username: username,
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
          username: username,
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
    };
  }

  async login(createAuthDto: CreateAuthDto) {
    const { email, username, password } = createAuthDto;
    const user = await this.usersRepository.findOne({
      where: [{ email: email }, { username: username }],
      select: [
        'id',
        'username',
        'email',
        'role',
        'password',
        'hashedRefreshToken',
        'is_active',
      ],
    });

    if (!user) {
      return {
        success: false,
        message: 'Invalid credentials',
      };
    }

    if (user.is_active === false) {
      return {
        success: false,
        message: 'Account is inactive. Please contact support.',
      };
    }

    const isPasswordValid = await Bycrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return {
        success: false,
        message: 'Invalid credentials',
      };
    }

    const tokens = await this.getTokens(
      user.id,
      user.email,
      user.role,
      user.username,
    );
    await this.saveRefreshToken(user.id, tokens.refreshToken);
    return {
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      tokens: {
        ...tokens,
      },
    };
  }
  async logout(userId: string) {
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

  async refreshTokens(id: string, refreshToken: string) {
    const user = await this.usersRepository.findOne({
      where: { id },
      select: ['id', 'username', 'email', 'role', 'hashedRefreshToken'],
    });

    if (!user || !user.hashedRefreshToken) {
      return {
        success: false,
        message: 'User not found or not logged in',
      };
    }

    const isRefreshTokenValid = await Bycrypt.compare(
      refreshToken,
      user.hashedRefreshToken,
    );
    if (!isRefreshTokenValid) {
      return {
        success: false,
        message: 'Invalid refresh token',
      };
    }

    const tokens = await this.getTokens(
      user.id,
      user.email,
      user.role,
      user.username,
    );
    await this.saveRefreshToken(user.id, tokens.refreshToken);
    return {
      success: true,
      message: 'Tokens refreshed successfully',
      ...tokens,
    };
  }

  async googleAuthRedirect(user: any) {
    const { id, email, role, username } = user;
    const { accessToken, refreshToken } = await this.getTokens(
      id,
      email,
      role,
      username,
    );
    return {
      user: {
        id,
        username,
        email,
        role,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  async getUserById(userId: string) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      select: ['id', 'username', 'email', 'role'],
    });
    return user;
  }

   generateResetToken(userId: string, email: string) {
    return this.jwtService.sign(
      { userId, email },
      {
        secret: this.configService.getOrThrow<string>('JWT_RESET_TOKEN_SECRET'),
        expiresIn: this.configService.getOrThrow<string>(
          'JWT_RESET_TOKEN_EXPIRATION_TIME',
        ),
      },
    );
  }

  async verifyResetToken(token: string) {
    try {
      const decoded = this.jwtService.verify(token, {
        secret: this.configService.getOrThrow<string>('JWT_RESET_TOKEN_SECRET'),
      });
      const decodedEmail = decoded.email;
      const user = await this.usersRepository.findOne({
        where: { email: decodedEmail },
        select: ['id'],
      });
      if (!user) {
        throw new NotFoundException('User not found');
      }
      return user.id;
    } catch (error) {
      return `Invalid or expired reset token: ${error.message}`;
    }
  }

  async updateUserPassword(userId: string, newPassword: string) {
    const hashedPassword = await Bycrypt.hash(newPassword, 10);
    await this.usersRepository.update(userId, { password: hashedPassword });
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<string> {
    const { email } = forgotPasswordDto;
    const user = await this.usersRepository.findOne({
      where: { email },
      select: ['email', 'id'],
    });

    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    const token = await this.generateResetToken(user.id, user.email);
    await this.mailService.sendResetEmail(email, token);
    return 'Password reset email sent successfully';
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<string> {
    const { token, newPassword, confirmPassword } = resetPasswordDto;

    if (newPassword !== confirmPassword) {
      throw new NotFoundException('Passwords do not match');
    }

    const userId = await this.verifyResetToken(token);
    if (!userId) {
      throw new NotFoundException('Invalid or expired reset token');
    }

    // Get user email for confirmation email
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      select: ['email'],
    });

    await this.updateUserPassword(userId, newPassword);

    // Send confirmation email
    if (user?.email) {
      try {
        await this.mailService.sendPasswordResetSuccessEmail(user.email);
      } catch (error) {
        console.error(
          'Failed to send password reset confirmation email:',
          error,
        );
      }
    }

    return 'Password has been reset successfully';
  }
}
