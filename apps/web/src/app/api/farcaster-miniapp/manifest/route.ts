import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const recordingId = searchParams.get('recordingId');

  if (!recordingId) {
    return new Response('Missing recordingId', { status: 400 });
  }

  const manifest = {
    name: "VOISSS Player",
    icon: `${process.env.NEXT_PUBLIC_APP_URL}/icon.png`, // Ensure you have an icon.png in your public folder
    entryPoint: `${process.env.NEXT_PUBLIC_APP_URL}/farcaster-miniapp/player`,
    initialPayload: {
      recordingId: recordingId,
    }
  };

  return NextResponse.json(manifest);
}
