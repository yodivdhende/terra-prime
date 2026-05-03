import { google } from 'googleapis';
import { VITE_GOOGLE_CLIENT_EMAIL, VITE_GOOGLE_PRIVATE_KEY } from '$env/static/private';

const SCOPES = ['https://www.googleapis.com/auth/drive'];

export class GoogleSheetManager {
  private getService() {
    const auth = new google.auth.JWT(
      VITE_GOOGLE_CLIENT_EMAIL,
      undefined,
      VITE_GOOGLE_PRIVATE_KEY.replace(/\\\n/gm, '\n'),
      SCOPES,
    )
    return google.drive({ version: 'v3', auth })
  }

  public async getHomeFiles() {
    const result = await this.getService().files.list({
      q: `'1FiG0BRYkVHD_0s6Hu236iNZaYo9lZfEQ' in parents and trashed = false`,
      fields: 'nextPageToken, files(id, name, mimeType)',
      spaces: 'drive',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    })
    return result.data.files.filter(file => file.name?.includes('_') === false);
  }
}

export function getGoogleDriveManager() {
  return new GoogleSheetManager();
}
