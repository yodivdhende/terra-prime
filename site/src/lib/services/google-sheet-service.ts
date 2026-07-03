import { google } from 'googleapis';
import { VITE_GOOGLE_CLIENT_EMAIL, VITE_GOOGLE_PRIVATE_KEY } from '$env/static/private';

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
];

export class GoogleSheetService {
  private async getSheets() {
    const client = await this.getClient();
    return google.sheets({ version: 'v4', auth: client });
  }

  private async getDrive() {
    const client = await this.getClient();
    return google.drive({ version: 'v3', auth: client });
  }

  private getClient() {
    return new google.auth.JWT(
      VITE_GOOGLE_CLIENT_EMAIL,
      undefined,
      VITE_GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      SCOPES
    );
  }

  public async getPlayTestSheetValues() {
    const sheets = await this.getSheets();
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: '1ZNb4uCkKHMEpzW6w-v_ApPAQZumXS23u5XtUp_8Cfxc',
      range: 'A1:B10',
    });

    return result.data.values;
  }

  public async appendPlayTestSheetValues(name: string, email: string) {
    const sheets = await this.getSheets();
    await sheets.spreadsheets.values.append({
      spreadsheetId: '1ZNb4uCkKHMEpzW6w-v_ApPAQZumXS23u5XtUp_8Cfxc',
      range: 'A1:C10',
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [[name, email, new Date().toString()]],
      },
    });
    return { success: true };
  }

  public async createResponseSpreadsheet(
    name: string,
    parentFolderId: string,
    headers: string[],
  ): Promise<string> {
    const drive = await this.getDrive();
    const created = await drive.files.create({
      requestBody: {
        name,
        mimeType: 'application/vnd.google-apps.spreadsheet',
        parents: [parentFolderId],
      },
      fields: 'id',
      supportsAllDrives: true,
    });
    const spreadsheetId = created.data.id;
    if (!spreadsheetId) throw new Error('drive returned no spreadsheet id');

    const sheets = await this.getSheets();
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Sheet1!A1',
      valueInputOption: 'RAW',
      requestBody: { values: [headers] },
    });
    return spreadsheetId;
  }

  public async appendResponseRow(
    spreadsheetId: string,
    headers: string[],
    row: (string | number)[],
  ): Promise<void> {
    const sheets = await this.getSheets();

    const meta = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: 'sheets.properties(sheetId,title,index)',
    });
    const tabs = (meta.data.sheets ?? [])
      .map(s => s.properties)
      .filter((p): p is NonNullable<typeof p> => !!p && typeof p.title === 'string')
      .sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
    if (tabs.length === 0) throw new Error(`spreadsheet ${spreadsheetId} has no tabs`);
    const latest = tabs[tabs.length - 1];
    const latestTitle = latest.title!;

    const headerRead = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${latestTitle.replace(/'/g, "''")}'!1:1`,
    });
    const existingHeaders = (headerRead.data.values?.[0] ?? []).map(v => String(v ?? ''));
    const headersMatch =
      existingHeaders.length === headers.length &&
      existingHeaders.every((h, i) => h === headers[i]);

    let targetTitle = latestTitle;
    if (!headersMatch) {
      const newTitle = `Responses ${new Date().toISOString()}`;
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [{ addSheet: { properties: { title: newTitle } } }],
        },
      });
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `'${newTitle.replace(/'/g, "''")}'!A1`,
        valueInputOption: 'RAW',
        requestBody: { values: [headers] },
      });
      targetTitle = newTitle;
    }

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `'${targetTitle.replace(/'/g, "''")}'!A1`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [row] },
    });
  }
}

export function getGoogleSheetService() {
  return new GoogleSheetService();
}
