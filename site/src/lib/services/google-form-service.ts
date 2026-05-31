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
}

export function getGoogleFormService() {
  return new GoogleFormService();
}
