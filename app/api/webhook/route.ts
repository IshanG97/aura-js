import { NextRequest, NextResponse } from 'next/server';

const VERIFICATION_TOKEN = process.env.WEBHOOK_VERIFICATION_TOKEN!;

// Replace these with your actual helper functions
import {
  extract_message_data,
  download_whatsapp_audio,
  transcribe_audio,
  append_health_log,
  generate_llm_response,
  get_intent,
  send_text_message,
  generate_voice_with_elevenlabs,
  upload_audio_to_whatsapp,
  send_audio_message,
} from '@/lib/whatsapp'; // Update import paths as needed

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

export async function POST(req: NextRequest) {
  const body = await req.json();
  console.log('📦 Incoming webhook payload:', body);

  const message_data = extract_message_data(body);

  if (!message_data) {
    return NextResponse.json({ status: 'ignored (no valid input)' });
  }

  let user_text = '';

  if (message_data.audio_id) {
    const audio_path = await download_whatsapp_audio(message_data.audio_id);
    user_text = await transcribe_audio(audio_path);
  } else if (message_data.text) {
    user_text = message_data.text;
  } else {
    return NextResponse.json({ status: 'ignored (no valid input)' });
  }

  const log_entry = {
    timestamp: new Date().toISOString(),
    sender: message_data.sender_wa_id,
    name: message_data.sender_name,
    message: user_text,
    role: 'user',
  };
  append_health_log(log_entry);
  console.log('📥 Received message:', log_entry);

  // LLM response
  console.log('🧠 Generating LLM response for user:', log_entry.sender);
  const [reply, history] = await generate_llm_response(log_entry.sender);

  // Task detection
  const intent = get_intent(history);
  if (Object.keys(intent).length > 0) {
    const task_type = intent.type;
    const task_content = intent.content;

    await fetch(`${process.env.ACTION_ENDPOINT}/tasks/1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        info_id: 1,
        type: task_type === 'reminder' ? 'Reminder' : 'Goal',
        content: task_content,
      }),
    });
  }

  const assistant_entry = {
    timestamp: new Date().toISOString(),
    sender: message_data.sender_wa_id,
    name: 'Aura',
    message: reply,
    role: 'assistant',
  };
  append_health_log(assistant_entry);
  console.log('🧠 LLM response generated:', assistant_entry);

  // Send reply
  if (message_data.text) {
    await send_text_message(message_data.sender_wa_id, reply);
  }

  if (message_data.audio_id) {
    const voice_path = await generate_voice_with_elevenlabs(reply);
    const media_id = await upload_audio_to_whatsapp(voice_path);
    await send_audio_message(message_data.sender_wa_id, media_id);
  }

  console.log('📤 Reply sent to user:', message_data.sender_wa_id);

  return NextResponse.json({ status: 'received' });
}