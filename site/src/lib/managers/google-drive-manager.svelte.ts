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

  public async getDocumentHtml(fileId: string): Promise<string> {
    const response = await this.getService().files.export(
      { fileId, mimeType: 'text/html' },
      { responseType: 'arraybuffer' },
    );
    const buffer = response.data as ArrayBuffer;
    return Buffer.from(buffer).toString('utf-8');
  }

  public async getFileStream(fileId: string): Promise<ReadableStream> {
    const response = await this.getService().files.get(
      { fileId, alt: 'media' },
      { responseType: 'stream' },
    );
    const nodeStream = response.data as unknown as NodeJS.ReadableStream;
    return new ReadableStream({
      start(controller) {
        nodeStream.on('data', (chunk) => controller.enqueue(chunk));
        nodeStream.on('end', () => controller.close());
        nodeStream.on('error', (err) => controller.error(err));
      },
    });
  }
}

export function getGoogleDriveManager() {
  return new GoogleSheetManager();
}
