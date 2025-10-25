import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

const { CLOUDFLARE_ACCOUNT_ID = '', CLOUDFLARE_API_TOKEN = '' } = env;

// Cloudflare Workers WebSocket types
interface CloudflareWebSocket extends WebSocket {
  accept(): void;
}

export const GET: RequestHandler = async ({ request, platform }) => {
  console.log('Realtime API called');

  // Check if this is a WebSocket upgrade request
  const upgradeHeader = request.headers.get('Upgrade');

  if (!upgradeHeader || upgradeHeader !== 'websocket') {
    console.log('Not a WebSocket request');
    return new Response('Expected WebSocket', { status: 426 });
  }

  if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
    console.error('Cloudflare credentials not configured');
    console.log('CLOUDFLARE_ACCOUNT_ID:', !!CLOUDFLARE_ACCOUNT_ID);
    console.log('CLOUDFLARE_API_TOKEN:', !!CLOUDFLARE_API_TOKEN);
    return new Response('Cloudflare credentials not configured', { status: 500 });
  }

  console.log('Credentials OK, checking runtime...');

  // Check if we're in Cloudflare Workers runtime
  // @ts-expect-error - WebSocketPair is available in Cloudflare Workers runtime
  if (typeof WebSocketPair !== 'undefined') {
    console.log('Using Cloudflare Workers WebSocket');
    // @ts-expect-error - WebSocketPair is available in Cloudflare Workers runtime
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair) as [CloudflareWebSocket, CloudflareWebSocket];

    // Handle the WebSocket connection
    handleWebSocketSession(server, platform);

    // Return response with WebSocket
    return new Response(null, {
      status: 101,
      webSocket: client,
    } as any);
  } else {
    // Development mode - WebSocket not supported in SvelteKit dev server
    console.error('WebSocket not supported in dev mode');
    return new Response(
      JSON.stringify({
        error: 'WebSocket not supported in development mode. Deploy to Cloudflare Pages to test.'
      }),
      {
        status: 501,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

async function handleWebSocketSession(webSocket: CloudflareWebSocket, platform: any) {
  webSocket.accept();

  let sessionConfig: any = null;
  let conversationHistory: Array<{ role: string; content: string; }> = [];
  let audioBuffer: string[] = [];
  let processingAudio = false;

  webSocket.addEventListener('message', async (event) => {
    try {
      const message = JSON.parse(event.data as string);

      // Initialize session
      if (message.type === 'session.update') {
        sessionConfig = message.session;
        conversationHistory.push({
          role: 'system',
          content: message.session.instructions || 'You are a helpful AI assistant in a voice conversation. Be concise and conversational.'
        });

        webSocket.send(JSON.stringify({
          type: 'session.created',
          session: sessionConfig
        }));
      }

      // Handle audio input buffer
      if (message.type === 'input_audio_buffer.append') {
        audioBuffer.push(message.audio);

        webSocket.send(JSON.stringify({
          type: 'input_audio_buffer.appended'
        }));
      }

      // Commit audio buffer and process
      if (message.type === 'input_audio_buffer.commit') {
        webSocket.send(JSON.stringify({
          type: 'input_audio_buffer.committed'
        }));

        if (audioBuffer.length > 0 && !processingAudio) {
          processingAudio = true;

          console.log('Processing audio buffer with', audioBuffer.length, 'chunks');

          // Combine audio chunks
          const combinedAudio = audioBuffer.join('');
          audioBuffer = [];

          // Transcribe audio using Cloudflare Whisper
          console.log('Transcribing audio...');
          const transcription = await transcribeAudio(combinedAudio);

          if (transcription) {
            console.log('Transcription:', transcription);
            conversationHistory.push({
              role: 'user',
              content: transcription
            });

            // Send transcription to client
            webSocket.send(JSON.stringify({
              type: 'conversation.item.created',
              item: {
                type: 'message',
                role: 'user',
                content: [{ type: 'text', text: transcription }]
              }
            }));

            // Generate AI response
            console.log('Generating AI response...');
            const aiResponse = await generateAIResponse(conversationHistory);

            if (aiResponse) {
              console.log('AI Response:', aiResponse);
              conversationHistory.push({
                role: 'assistant',
                content: aiResponse
              });

              // Send text response to client
              webSocket.send(JSON.stringify({
                type: 'response.text.delta',
                delta: aiResponse
              }));

              // Convert response to speech
              const audioResponse = await textToSpeech(aiResponse);

              if (audioResponse) {
                // Send audio response back to client
                webSocket.send(JSON.stringify({
                  type: 'response.audio.delta',
                  delta: audioResponse
                }));
              }

              webSocket.send(JSON.stringify({
                type: 'response.audio.done'
              }));
            }
          } else {
            console.log('No transcription received');
            webSocket.send(JSON.stringify({
              type: 'response.audio.done'
            }));
          }

          processingAudio = false;
        }
      }

      // Handle conversation items
      if (message.type === 'conversation.item.create') {
        webSocket.send(JSON.stringify({
          type: 'conversation.item.created',
          item: message.item
        }));
      }

      // Handle response creation requests
      if (message.type === 'response.create') {
        webSocket.send(JSON.stringify({
          type: 'response.created'
        }));
      }

    } catch (error) {
      console.error('WebSocket message error:', error);
      webSocket.send(JSON.stringify({
        type: 'error',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'internal_error'
        }
      }));
    }
  });

  webSocket.addEventListener('close', () => {
    conversationHistory = [];
    audioBuffer = [];
  });

  webSocket.addEventListener('error', (event) => {
    console.error('WebSocket error:', event);
  });
}

async function transcribeAudio(base64Audio: string): Promise<string | null> {
  try {
    // Convert base64 to ArrayBuffer
    const binaryString = atob(base64Audio);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Cloudflare Whisper API
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/openai/whisper`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        },
        body: bytes.buffer
      }
    );

    const result = await response.json();
    return result.result?.text || null;
  } catch (error) {
    console.error('Error transcribing audio:', error);
    return null;
  }
}

async function generateAIResponse(messages: Array<{ role: string; content: string; }>): Promise<string | null> {
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/meta/llama-3.1-8b-instruct`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messages,
          max_tokens: 150
        })
      }
    );

    const result = await response.json();
    return result.result?.response || null;
  } catch (error) {
    console.error('Error generating AI response:', error);
    return null;
  }
}

async function textToSpeech(text: string): Promise<string | null> {
  try {
    // Note: Cloudflare doesn't have native TTS yet, so we'll echo back text
    // You could integrate with other TTS services or wait for Cloudflare TTS
    // For now, we'll return null to indicate no audio playback
    console.log('AI Response (text):', text);

    // TODO: Integrate with a TTS service like:
    // - ElevenLabs API
    // - Google Cloud TTS
    // - AWS Polly
    // Or wait for Cloudflare to release TTS models

    return null;
  } catch (error) {
    console.error('Error converting text to speech:', error);
    return null;
  }
}
