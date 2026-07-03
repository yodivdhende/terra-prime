import { google } from 'googleapis';
import {
  VITE_GOOGLE_CLIENT_EMAIL,
  VITE_GOOGLE_PRIVATE_KEY,
  VITE_GOOGLE_EMAIL_SUBJECT
} from '$env/static/private';

const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];

export class GoogleGmailService {
  private getService() {
    console.log({
      VITE_GOOGLE_EMAIL_SUBJECT,
    })
    const auth = new google.auth.JWT(
      VITE_GOOGLE_CLIENT_EMAIL,
      undefined,
      VITE_GOOGLE_PRIVATE_KEY.replace(/\\\n/gm, '\n'),
      SCOPES,
      VITE_GOOGLE_EMAIL_SUBJECT
    );
    return google.gmail({ version: 'v1', auth });
  }

  public async sendMail({
    to,
    subject,
    html
  }: {
    to: string;
    subject: string;
    html: string;
  }): Promise<void> {
    const from = VITE_GOOGLE_EMAIL_SUBJECT;
    const encodedSubject = `=?utf-8?B?${Buffer.from(subject, 'utf-8').toString('base64')}?=`;
    const message = [
      `From: ${from}`,
      `To: ${to}`,
      `Subject: ${encodedSubject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      'Content-Transfer-Encoding: 7bit',
      '',
      html
    ].join('\r\n');
    const raw = Buffer.from(message, 'utf-8')
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    await this.getService().users.messages.send({
      userId: 'me',
      requestBody: { raw }
    });
  }
}

export function getGoogleGmailService() {
  return new GoogleGmailService();
}
