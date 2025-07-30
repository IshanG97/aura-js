// lib/whatsapp.ts

export interface MessageData {
  sender_wa_id: string;
  sender_name: string;
  text?: string;
  audio_id?: string;
}

export function extract_message_data(body: unknown): MessageData {
  return {
    sender_wa_id: 'mock-wa-id',
    sender_name: 'John Doe',
    text: 'hello',
    audio_id: undefined,
  };
}

export async function download_whatsapp_audio(_: string): Promise<string> {
  return '/tmp/audio.mp3';
}

export async function transcribe_audio(_: string): Promise<string> {
  return 'mock transcription';
}

export function append_health_log(_: Record<string, unknown>): void {
  return;
}

export async function generate_llm_response(_: string): Promise<[string, Record<string, unknown>]> {
  return ['mock response', {}];
}

export function get_intent(_: unknown): Record<string, string> {
  return {};
}

export async function send_text_message(_: string, __: string): Promise<void> {
  return;
}

export async function generate_voice_with_elevenlabs(_: string): Promise<string> {
  return '/tmp/voice.mp3';
}

export async function upload_audio_to_whatsapp(_: string): Promise<string> {
  return 'mock-media-id';
}

export async function send_audio_message(_: string, __: string): Promise<void> {
  return;
}