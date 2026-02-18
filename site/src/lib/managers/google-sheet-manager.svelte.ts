import { google } from 'googleapis';
import ServiceKey from '$lib/server/google-service-account-key.json';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

export class GoogleSheetManager {
    private async getSheets() {
        const client = await this.getClient(); 
        return google.sheets({ version: 'v4', auth: client });
    }
    
    private getClient() {
        return new google.auth.JWT(
            ServiceKey.client_email,
            undefined,
            ServiceKey.private_key,
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
            range: 'A1:B10',
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            requestBody: {
                values: [[name, email]],
            },
        });
    }

}

export function getGoogleSheetManager() {
    return new GoogleSheetManager();
}