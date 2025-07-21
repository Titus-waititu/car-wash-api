// src/mail/mail.service.ts
import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import 'dotenv/config';
import { ConfigService } from '@nestjs/config';


@Injectable()
export class MailService {
  constructor(
    private readonly configService: ConfigService
  ) {}

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



  async sendLoginSuccessEmail(email: string) {
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
    const subject = 'Reset Your Password';
    const text = `To reset your password, please send a POST request to the following URL:\n\n${resetLink}\n\nIf you did not request a password reset, please ignore this email.`
    const html = `<p>To reset your password, please send a POST request to the following URL:</p><p><a href="${resetLink}">${resetLink}</a></p><p>If you did not request a password reset, please ignore this email.</p>`;
    
    await this.sendMail({
      to: email,
      subject: subject,
      text: text,
      html: html,
    });
    
    return `Reset password email sent to ${email}`;
  }
  
}