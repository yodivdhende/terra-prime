import { google, type forms_v1 } from 'googleapis';
import { VITE_GOOGLE_CLIENT_EMAIL, VITE_GOOGLE_PRIVATE_KEY } from '$env/static/private';

const SCOPES = ['https://www.googleapis.com/auth/forms.body.readonly'];

export type GoogleFormItem = forms_v1.Schema$Item;
export type GoogleForm = forms_v1.Schema$Form;
export type AnswerMap = Record<string, string | string[]>;

export class GoogleFormService {
  private getService() {
    const auth = new google.auth.JWT(
      VITE_GOOGLE_CLIENT_EMAIL,
      undefined,
      VITE_GOOGLE_PRIVATE_KEY.replace(/\\\n/gm, '\n'),
      SCOPES,
    );
    return google.forms({ version: 'v1', auth });
  }

  public async getForm(formId: string): Promise<GoogleForm> {
    const response = await this.getService().forms.get({ formId });
    return response.data;
  }

  private async getAccessToken(): Promise<string | null> {
    const auth = new google.auth.JWT(
      VITE_GOOGLE_CLIENT_EMAIL,
      undefined,
      VITE_GOOGLE_PRIVATE_KEY.replace(/\\\n/gm, '\n'),
      SCOPES,
    );
    const tokenRes = await auth.getAccessToken();
    return tokenRes.token ?? null;
  }

  public async submitForm(formId: string, answers: AnswerMap): Promise<{ ok: boolean; status: number }> {
    const form = await this.getForm(formId);
    const responderUri = form.responderUri;
    if (!responderUri) throw new Error('form has no responderUri');

    const match = responderUri.match(/\/forms\/d\/e\/([^/]+)\//);
    if (!match) throw new Error('could not parse responderUri');
    const publishedId = match[1];

    const viewformUrl = `https://docs.google.com/forms/d/e/${publishedId}/viewform`;
    const browserHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
    };

    // Fetch the form page to get session cookies and the fbzx CSRF token.
    const viewRes = await fetch(viewformUrl, { headers: browserHeaders });
    const rawCookies: string[] = typeof (viewRes.headers as any).getSetCookie === 'function'
      ? (viewRes.headers as any).getSetCookie()
      : (viewRes.headers.get('set-cookie') ?? '').split(/,(?=\s*\w+=)/).filter(Boolean);
    const cookies = rawCookies.map(c => c.split(';')[0].trim()).join('; ');
    const html = await viewRes.text();
    const fbzxMatch = html.match(/["']fbzx["']\s*[,:\s]+["'](-?\d+)["']/) ?? html.match(/name="fbzx"\s+value="(-?\d+)"/);
    const fbzx = fbzxMatch ? fbzxMatch[1] : String(-Math.floor(Math.random() * 1e15));

    // The Forms API returns questionIds as hex strings; formResponse needs them as decimal integers.
    const toEntryId = (hexId: string) => parseInt(hexId, 16).toString();

    const params = new URLSearchParams();
    params.set('fvv', '1');
    params.set('pageHistory', '0');
    params.set('fbzx', fbzx);
    for (const [qid, value] of Object.entries(answers)) {
      const entryId = toEntryId(qid);
      if (Array.isArray(value)) {
        for (const v of value) if (v !== '') params.append(`entry.${entryId}`, v);
      } else if (value !== '' && value != null) {
        params.append(`entry.${entryId}`, value);
      }
    }

    const res = await fetch(`https://docs.google.com/forms/d/e/${publishedId}/formResponse`, {
      method: 'POST',
      headers: {
        ...browserHeaders,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer': viewformUrl,
        'Origin': 'https://docs.google.com',
        ...(cookies ? { Cookie: cookies } : {}),
      },
      body: params.toString(),
    });

    const authRedirected = !res.url.startsWith('https://docs.google.com');
    if (authRedirected) {
      console.error('[form submit] redirected to:', res.url);
      return { ok: false, status: 401 };
    }
    return { ok: res.ok, status: res.status };
  }
}

export function getGoogleFormService() {
  return new GoogleFormService();
}
