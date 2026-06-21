import { google } from 'googleapis';
import { VITE_GOOGLE_CLIENT_EMAIL, VITE_GOOGLE_PRIVATE_KEY } from '$env/static/private';

const SCOPES = ['https://www.googleapis.com/auth/drive'];

export class GoogleDriveService {
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
    return result.data.files?.filter(file => file.name != null && file.name[0] != '_') ?? [];
  }

  public async getFolderFiles(folderId: string) {
    const result = await this.getService().files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'nextPageToken, files(id, name, mimeType)',
      spaces: 'drive',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });
    return result.data.files?.filter(file => file.name != null && file.name[0] !== '_') ?? [];
  }

  public async getDocumentHtml(fileId: string): Promise<string> {
    const response = await this.getService().files.export(
      { fileId, mimeType: 'text/html' },
      { responseType: 'arraybuffer' },
    );
    const buffer = response.data as ArrayBuffer;
    const html = Buffer.from(buffer).toString('utf-8');
    return html.replace(/_[^_]*_/g, '');
  }

  private async getExcludedFolderIds(): Promise<Set<string>> {
    const result = await this.getService().files.list({
      q: `mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: 'files(id, name)',
      spaces: 'drive',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });
    const ids = new Set<string>();
    for (const folder of result.data.files ?? []) {
      if (folder.name && folder.name.startsWith('_') && folder.id) {
        ids.add(folder.id);
      }
    }
    return ids;
  }

  public async searchFiles(query: string) {
    const escaped = query.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const [result, excludedFolderIds] = await Promise.all([
      this.getService().files.list({
        q: `name contains '${escaped}' and trashed = false`,
        fields: 'files(id, name, mimeType, parents)',
        spaces: 'drive',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
        pageSize: 20,
      }),
      this.getExcludedFolderIds(),
    ]);
    return result.data.files?.filter(file => {
      if (!file.name || file.name.startsWith('_')) return false;
      if (file.parents?.some(parentId => excludedFolderIds.has(parentId))) return false;
      return true;
    }) ?? [];
  }

  public async getFileMetadata(fileId: string): Promise<{ mimeType: string; size: number }> {
    const res = await this.getService().files.get({
      fileId,
      fields: 'mimeType,size',
      supportsAllDrives: true,
    });
    return {
      mimeType: res.data.mimeType ?? 'application/octet-stream',
      size: Number(res.data.size ?? 0),
    };
  }

  public async getFileStream(fileId: string, rangeHeader?: string): Promise<ReadableStream> {
    const headers: Record<string, string> = {};
    if (rangeHeader) headers['Range'] = rangeHeader;
    const response = await this.getService().files.get(
      { fileId, alt: 'media', supportsAllDrives: true },
      { responseType: 'stream', headers },
    );
    const nodeStream = response.data as unknown as NodeJS.ReadableStream;
    return new ReadableStream({
      start(controller) {
        const onData = (chunk: Buffer) => controller.enqueue(chunk);
        const onEnd = () => {
          nodeStream.removeListener('data', onData);
          nodeStream.removeListener('error', onError);
          controller.close();
        };
        const onError = (err: Error) => {
          nodeStream.removeListener('data', onData);
          nodeStream.removeListener('end', onEnd);
          controller.error(err);
        };
        nodeStream.on('data', onData);
        nodeStream.once('end', onEnd);
        nodeStream.once('error', onError);
      },
      cancel() {
        (nodeStream as NodeJS.ReadableStream & { destroy?: () => void }).destroy?.();
      },
    });
  }
}

export function getGoogleDriveService() {
  return new GoogleDriveService();
}
