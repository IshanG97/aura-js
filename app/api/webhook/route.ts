// app/api/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';

const VERIFICATION_TOKEN = process.env.WEBHOOK_VERIFICATION_TOKEN!;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const hub_mode = searchParams.get('hub.mode');
  const hub_challenge = searchParams.get('hub.challenge');
  const hub_verify_token = searchParams.get('hub.verify_token');

  console.log(`📡 Received token: '${hub_verify_token}' | Expected: '${VERIFICATION_TOKEN}'`);

  if (hub_mode === 'subscribe' && hub_verify_token === VERIFICATION_TOKEN) {
    return new NextResponse(hub_challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}