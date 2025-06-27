import nodemailer from 'nodemailer';
import winston from 'winston';

import { config } from '../startup/config';
/**
 * Email Gateway Configuration
 */
export const emailGateway = (
  EmailData: string,
  subject: string,
  body: string,
): Promise<boolean> => {
  return new Promise<boolean>((resolve, _reject): void => {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: config.email.user,
        clientId: config.email.clientId,
        clientSecret: config.email.clientSecret,
        refreshToken: config.email.refreshToken,
        accessToken: config.email.accessToken,
      },
    });
    const mailOptions = {
      from: config.appName,
      to: EmailData,
      subject: subject,
      html: body,
    };

    transporter.sendMail(mailOptions, (err: Error | null, info: { response: string }): void => {
      if (err) {
        winston.error(`Email sending failed: ${err.message}`);
        resolve(false); // Indicate failure
      } else {
        winston.info(`Email sent successfully: ${info.response}`);
        resolve(true); // Indicate success
      }
    });
  });
};
