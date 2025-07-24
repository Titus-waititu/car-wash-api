// src/mail/mail.service.ts
import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import 'dotenv/config';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  constructor(private readonly configService: ConfigService) {}

  async sendMail(options: {
    to: string;
    subject: string;
    text?: string;
    html?: string;
  }): Promise<void> {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    await transporter.sendMail(mailOptions);
  }

   sendLoginSuccessEmail(email: string) {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
      },
    });

    // mail.service.ts
    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: 'Login Successful',
      html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login Successful!</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            background-color: #f4f4f4;
            padding: 20px;
            margin: 0;
        }
        .container {
            max-width: 600px;
            margin: auto;
            background: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        h2 {
            color: #007BFF;
        }
        p {
            margin-bottom: 10px;
        }
        .footer {
            margin-top: 20px;
            font-size: 14px;
            color: #777;
        }
    </style>
</head>
<body>
    <div class="container">
        <h2>Login Successful!</h2>
        <p>Hello,</p>
        <p>Your login to the Car Rental Management System was successful.</p>
        <p>Thank you for using our service!</p>
        <div class="footer">
            <p>Best regards,<br>Car Rental Management Team</p>
        </div>
    </div>
</body>
</html>`,
    };

    return transporter.sendMail(mailOptions);
  }

  async sendResetEmail(email: string, token: string) {
    const resetLink = `http://localhost:8080/auth/reset-password?token=${token}`;
    const subject = 'Reset Your Password - CarWash Service';
    const text = `To reset your password, please use the following link:\n\n${resetLink}\n\nThis link will expire in 15 minutes.\n\nIf you did not request a password reset, please ignore this email.`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p>Hello,</p>
          <p>We received a request to reset the password for your CarWash Service account.</p>
          <p>To reset your password, please click the button below:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" 
               style="background-color: #007BFF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>
          
          <p>Or copy and paste this link into your browser:</p>
          <p style="background-color: #f0f0f0; padding: 10px; border-radius: 3px; word-break: break-all;">
            ${resetLink}
          </p>
        </div>

        <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <p><strong>Security Information:</strong></p>
          <ul>
            <li>This link will expire in 15 minutes for security reasons</li>
            <li>This link can only be used once</li>
            <li>If you did not request this reset, please ignore this email</li>
          </ul>
        </div>

        <div style="margin: 30px 0; text-align: center;">
          <p>Thank you for using CarWash Service!</p>
          <p style="color: #666; font-size: 12px;">This is an automated email. Please do not reply.</p>
        </div>
      </div>
    `;

    await this.sendMail({
      to: email,
      subject: subject,
      text: text,
      html: html,
    });

    return `Reset password email sent to ${email}`;
  }

  async sendPasswordResetSuccessEmail(email: string) {
    const subject = 'Password Reset Successful - CarWash Service';
    const text =
      'Your password has been successfully reset. If you did not make this change, please contact support immediately.';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">Password Reset Successful</h2>
        
        <div style="background-color: #d4edda; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;">
          <p><strong>Your password has been successfully reset!</strong></p>
          <p>This email confirms that your CarWash Service account password was changed.</p>
        </div>

        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Security Information:</strong></p>
          <ul>
            <li>Change Date: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</li>
            <li>If you did not make this change, please contact support immediately</li>
            <li>Consider enabling two-factor authentication for added security</li>
          </ul>
        </div>

        <div style="margin: 30px 0; text-align: center;">
          <p>Thank you for keeping your account secure!</p>
          <p style="color: #666; font-size: 12px;">This is an automated email. Please do not reply.</p>
        </div>
      </div>
    `;

    await this.sendMail({
      to: email,
      subject: subject,
      text: text,
      html: html,
    });

    return `Password reset confirmation email sent to ${email}`;
  }
}
