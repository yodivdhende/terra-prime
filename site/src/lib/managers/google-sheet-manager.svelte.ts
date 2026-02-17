import { google } from 'googleapis';
import { authenticate } from '@google-cloud/local-auth';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const credentialsPath = path.resolve(__dirname, '../server/google-api-credentials.json');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

export class GoogleSheetManager {
    private async getSheets() {
        const auth = await authenticate({
            keyfilePath: credentialsPath,
            scopes: SCOPES,
        })
        return google.sheets({ version: 'v4', auth });
    }

    public async getPlayTestSheetValues() {
        const sheets = await this.getSheets();
        const result = await sheets.spreadsheets.values.get({
            spreadsheetId: '1ZNb4uCkKHMEpzW6w-v_ApPAQZumXS23u5XtUp_8Cfxc',
            range: 'A1:B10',
        });
        return result.data.values;  
    }

}

export function getGoogleSheetManager() {
    return new GoogleSheetManager();
}