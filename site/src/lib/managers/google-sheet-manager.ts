import { google } from 'googleapis';
import { authenticate } from '@google-cloud/local-auth';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const credentialsPath = path.resolve(__dirname, '../../server/credentials.json');

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

export class GoogleSheetManager {
    private auth: any;
    public sheets: any;

    constructor() {
        this.init();
    }

    private async init() {
        this.auth = await authenticate({
            keyfilePath: credentialsPath,
            scopes: SCOPES,
        });
        this.sheets = google.sheets({ version: 'v4', auth: this.auth });
    }
}