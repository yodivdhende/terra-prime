import { type RequestHandler } from '@sveltejs/kit';
import { getGoogleDriveService } from '$lib/services/google-drive-service';

function swapBlackAndWhite(html: string): string {
  return html
    .replace(/#([0-9a-fA-F]{6})(?![0-9a-fA-F])/gi, (match, hex) => {
      const h = hex.toLowerCase();
      if (h === '000000') return '#ffffff';
      if (h === 'ffffff') return '#000000';
      return match;
    })
    .replace(/#([0-9a-fA-F]{3})(?![0-9a-fA-F])/gi, (match, hex) => {
      const h = hex.toLowerCase();
      if (h === '000') return '#fff';
      if (h === 'fff') return '#000';
      return match;
    })
    .replace(/rgba\(\s*(0|255)\s*,\s*(0|255)\s*,\s*(0|255)\s*,\s*([^)]+)\)/gi, (match, r, g, b, a) => {
      if (+r === 0 && +g === 0 && +b === 0) return `rgba(255, 255, 255, ${a})`;
      if (+r === 255 && +g === 255 && +b === 255) return `rgba(0, 0, 0, ${a})`;
      return match;
    })
    .replace(/rgb\(\s*(0|255)\s*,\s*(0|255)\s*,\s*(0|255)\s*\)/gi, (match, r, g, b) => {
      if (+r === 0 && +g === 0 && +b === 0) return 'rgb(255, 255, 255)';
      if (+r === 255 && +g === 255 && +b === 255) return 'rgb(0, 0, 0)';
      return match;
    })
    .replace(/(?<=color\s*:\s*)(black|white)(?=\s*[;"}])/gi, (match) =>
      match.toLowerCase() === 'black' ? 'white' : 'black'
    );
}

export const GET: RequestHandler = async ({ params }) => {
  const { fileId } = params;
  const html = await getGoogleDriveService().getDocumentHtml(fileId);
  return new Response(swapBlackAndWhite(html), {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
};
