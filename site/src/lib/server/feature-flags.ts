import { google } from 'googleapis';
import { VITE_GOOGLE_CLIENT_EMAIL, VITE_GOOGLE_PRIVATE_KEY } from '$env/static/private';
import { env } from '$env/dynamic/private';

type Platform = 'dev' | 'test' | 'live';
const PLATFORM_COLUMN: Record<Platform, number> = { dev: 1, test: 2, live: 3 };

function getPlatformColumn(): number {
  const platform = (env.PLATFORM ?? 'dev').toLowerCase() as Platform;
  return PLATFORM_COLUMN[platform] ?? PLATFORM_COLUMN.dev;
}

const SPREADSHEET_ID = '1cpFltTFhzOR6wUvolhYdwugmQDNxuTMFQDNgPrXWfpk';
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
const CACHE_TTL_MS = 5 * 60 * 1000;

export type FeatureFlags = Record<string, boolean>;

let cache: { flags: FeatureFlags; expiresAt: number } | null = null;

function getClient() {
  return new google.auth.JWT(
    VITE_GOOGLE_CLIENT_EMAIL,
    undefined,
    VITE_GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    SCOPES
  );
}

async function fetchFromSheet(): Promise<FeatureFlags> {
  const sheets = google.sheets({ version: 'v4', auth: getClient() });
  const result = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    // Skip header row, read up to 200 flags
    range: 'A2:D201'
  });

  const rows = result.data.values ?? [];
  const flags: FeatureFlags = {};
  const col = getPlatformColumn();

  for (const row of rows) {
    const name = row[0];
    const active = row[col];
    if (typeof name === 'string' && name.trim()) {
      flags[name.trim()] = active === 'TRUE' || active === true;
    }
  }

  return flags;
}

export async function getFeatureFlags(): Promise<FeatureFlags> {
  const now = Date.now();

  if (cache && now < cache.expiresAt) {
    return cache.flags;
  }

  const flags = await fetchFromSheet();
  cache = { flags, expiresAt: now + CACHE_TTL_MS };
  return flags;
}

// Invalidate the cache (e.g. for testing or admin endpoints)
export function invalidateFeatureFlagCache() {
  cache = null;
}

export function isEnabled(flags: FeatureFlags, name: string): boolean {
  return flags[name] === true;
}
