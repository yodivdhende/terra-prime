import { google } from 'googleapis';
import { VITE_GOOGLE_CLIENT_EMAIL, VITE_GOOGLE_PRIVATE_KEY } from '$env/static/private';

const SCOPES = ['https://www.googleapis.com/auth/drive'];

export class GoogleSheetManager {
  private async getService() {
    const auth = new google.auth.JWT(
      VITE_GOOGLE_CLIENT_EMAIL,
      undefined,
      VITE_GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      SCOPES
    )

    return google.drive({ version: 'v3', auth })
  }

  public async getHomeFiles() {
    const result = (await this.getService()).files.list({
      q: '1FiG0BRYkVHD_0s6Hu236iNZaYo9lZfEQ'
    })
    return result;
  }
}

export function getGoogleDriveManager() {
  return new getGoogleDriveManager();
}
