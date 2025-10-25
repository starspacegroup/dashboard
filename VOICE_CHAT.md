# Voice Chat Feature

This dashboard includes an AI-powered voice chat feature using Cloudflare
Workers AI.

## How It Works

1. **Audio Capture**: Microphone input is captured and converted to PCM16 format
2. **Voice Activity Detection (VAD)**: Automatically detects when you stop
   speaking
3. **Transcription**: Audio is transcribed using Cloudflare's Whisper model
   (@cf/openai/whisper)
4. **AI Response**: Transcribed text is processed by Llama 3.1
   (@cf/meta/llama-3.1-8b-instruct)
5. **Display**: Conversation is displayed in real-time in the chat window

## Setup

### 1. Environment Variables

Add these to your `.env` file:

```bash
CLOUDFLARE_ACCOUNT_ID=your_account_id_here
CLOUDFLARE_API_TOKEN=your_api_token_here
```

### 2. Get Your Cloudflare Credentials

**Account ID:**

- Go to https://dash.cloudflare.com/
- Your account ID is in the URL or sidebar

**API Token:**

- Go to https://dash.cloudflare.com/profile/api-tokens
- Create a new token with "Workers AI" read permissions
- Or use an existing token with AI model access

### 3. Build and Run with Wrangler

**IMPORTANT:** The voice chat requires WebSocket support, which is only
available through Wrangler (not `npm run dev`).

```bash
# Build the app
npm run build

# Run with Wrangler (supports WebSockets)
wrangler pages dev .svelte-kit/cloudflare --compatibility-date=2024-01-01 --port=5173
```

### 4. Test the Feature

1. Open http://localhost:5173
2. Click the voice chat button
3. Allow microphone access
4. Start speaking - the AI will respond after you stop talking

## Important: Development vs Production

- **`npm run dev`** - Regular Vite dev server, WebSockets NOT supported ❌
- **`wrangler pages dev`** - Cloudflare runtime, WebSockets supported ✅
- **Production (Cloudflare Pages)** - Full WebSocket support ✅

Always use wrangler for local testing of the voice chat feature!

## Voice Activity Detection

The system uses simple VAD with these settings (adjustable in
`VoiceChat.svelte`):

- **SILENCE_THRESHOLD**: `0.01` - Audio level below this is considered silence
- **SILENCE_DURATION**: `1000ms` - How long silence must last before committing
  audio

To make it more/less sensitive:

- **Higher threshold** = needs louder speech to trigger
- **Lower threshold** = picks up quieter speech
- **Longer duration** = waits longer before processing
- **Shorter duration** = processes faster but may cut off speech

## Current Limitations

### Text-to-Speech (TTS)

Cloudflare doesn't currently have a native TTS model, so the AI responses are
displayed as text only. You can integrate with:

- **ElevenLabs** - High quality voice synthesis
- **Google Cloud TTS** - Good quality, many voices
- **AWS Polly** - Amazon's TTS service
- **OpenAI TTS** - Part of OpenAI's API

To add TTS, modify the `textToSpeech()` function in
`src/routes/api/realtime/+server.ts`.

## Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────────┐
│  VoiceChat  │ WebSocket│   /api/      │  HTTP   │   Cloudflare    │
│  Component  ├────────>│   realtime   ├────────>│   Workers AI    │
│             │         │              │         │                 │
│  - Capture  │         │  - Session   │         │  - Whisper      │
│  - VAD      │         │  - Transcribe│         │  - Llama 3.1    │
│  - Display  │         │  - Generate  │         │                 │
└─────────────┘         └──────────────┘         └─────────────────┘
```

## API Endpoints

### WebSocket: `/api/realtime`

**Client → Server Messages:**

- `session.update` - Initialize session with config
- `input_audio_buffer.append` - Send audio chunk (base64 PCM16)
- `input_audio_buffer.commit` - Process accumulated audio

**Server → Client Messages:**

- `session.created` - Session initialized
- `input_audio_buffer.committed` - Audio being processed
- `conversation.item.created` - User message transcribed
- `response.text.delta` - AI text response
- `response.audio.delta` - AI audio response (when TTS is implemented)
- `response.audio.done` - Response complete
- `error` - Error occurred

## Troubleshooting

### No audio detected

- Check microphone permissions
- Adjust `SILENCE_THRESHOLD` (try 0.005 for quieter environments)
- Check browser console for errors

### Slow responses

- Normal - transcription + LLM generation takes 2-5 seconds
- Consider using a faster model if available

### WebSocket connection fails

- Verify Cloudflare credentials are set
- Check browser console and server logs
- Ensure you're using HTTPS in production (WSS required)

### Audio cuts off mid-sentence

- Increase `SILENCE_DURATION` to 1500ms or 2000ms
- This gives you more pause time while speaking

## Development

The voice chat code is in:

- **Frontend**: `src/lib/components/VoiceChat.svelte`
- **Backend**: `src/routes/api/realtime/+server.ts`

Both files are well-commented for easy modification.
