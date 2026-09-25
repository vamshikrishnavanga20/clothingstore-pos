import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  Pragma: 'no-cache',
  Expires: '0',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: NO_CACHE_HEADERS });
}

export async function GET() {
  return NextResponse.json(
    {
      appName: 'Roman Island POS',
      latestVersion: '1.0.1',
      versionCode: 2,
      minSupportedVersion: '1.0.0',
      otaChannel: 'production',
      runtimeVersion: '1.0.0',
      releaseDate: new Date().toISOString(),
      forceUpdate: false,
      releaseNotes: [
        '🚀 Over-The-Air auto update engine enabled',
        '🖨️ In-app thermal receipt printing & PDF sharing',
        '⚡ High-speed offline billing with background sync',
        '📷 Camera barcode scanner support for quick checkout',
        '🛡️ Super-Admin multi-branch management & security'
      ],
      apkDownloadUrl: 'https://github.com/vamshikrishnavanga20/clothingstore-pos/releases/latest',
      message: 'Terminal software is active and operational.'
    },
    { headers: NO_CACHE_HEADERS }
  );
}
