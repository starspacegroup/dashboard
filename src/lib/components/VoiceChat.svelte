<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { fly, fade } from 'svelte/transition';

	export let isOpen = false;
	export let onClose: () => void;

	let isConnected = false;
	let isConnecting = false;
	let isMuted = false;
	let isProcessing = false; // AI is processing speech
	let audioContext: AudioContext | null = null;
	let mediaStream: MediaStream | null = null;
	let webSocket: WebSocket | null = null;
	let elapsedTime = 0;
	let timerInterval: number | null = null;
	let audioProcessor: ScriptProcessorNode | null = null;
	let isSpeaking = false;
	let silenceStart: number | null = null;
	let conversationMessages: Array<{ role: 'user' | 'assistant', text: string }> = [];
	const SILENCE_THRESHOLD = 0.01; // Adjust sensitivity
	const SILENCE_DURATION = 1000; // 1 second of silence to trigger commit

	// Cloudflare Workers AI Realtime API endpoint
	// Using local SvelteKit API route that connects to Cloudflare AI
	const CLOUDFLARE_REALTIME_URL = typeof window !== 'undefined' 
		? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/realtime`
		: 'ws://localhost:5173/api/realtime';

	onMount(() => {
		if (isOpen && !isConnected) {
			startVoiceChat();
		}
	});

	onDestroy(() => {
		cleanup();
	});

	$: if (isOpen && !isConnected && !isConnecting) {
		startVoiceChat();
	}

	$: if (!isOpen) {
		cleanup();
	}

	function formatTime(seconds: number): string {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
	}

	async function startVoiceChat() {
		try {
			isConnecting = true;

			// Request microphone access
			mediaStream = await navigator.mediaDevices.getUserMedia({ 
				audio: {
					echoCancellation: true,
					noiseSuppression: true,
					autoGainControl: true
				} 
			});

			// Create audio context for processing
			audioContext = new AudioContext({ sampleRate: 16000 });
			const source = audioContext.createMediaStreamSource(mediaStream);

		// Connect to Cloudflare Realtime WebSocket
		webSocket = new WebSocket(CLOUDFLARE_REALTIME_URL);
		console.log('Attempting WebSocket connection to:', CLOUDFLARE_REALTIME_URL);

		webSocket.onopen = () => {
			console.log('Connected to Cloudflare Realtime');
			isConnected = true;
			isConnecting = false;
			startTimer();				// Send initial configuration
				if (webSocket) {
					webSocket.send(JSON.stringify({
						type: 'session.update',
						session: {
							modalities: ['text', 'audio'],
							instructions: 'You are a helpful AI assistant in a voice conversation.',
							voice: 'alloy',
							input_audio_format: 'pcm16',
							output_audio_format: 'pcm16',
							turn_detection: {
								type: 'server_vad',
								threshold: 0.5,
								prefix_padding_ms: 300,
								silence_duration_ms: 500
							}
						}
					}));
				}
			};

			webSocket.onmessage = async (event) => {
				try {
					const message = JSON.parse(event.data);
					console.log('Received message:', message.type);
					
					// Session created confirmation
					if (message.type === 'session.created') {
						console.log('Session created successfully');
					}
					
					// Audio buffer committed - AI is processing
					if (message.type === 'input_audio_buffer.committed') {
						console.log('Audio buffer committed, AI processing...');
						isProcessing = true;
					}
					
					// Conversation item created (user message transcribed)
					if (message.type === 'conversation.item.created' && message.item?.role === 'user') {
						const text = message.item.content?.[0]?.text || '';
						if (text) {
							conversationMessages = [...conversationMessages, { role: 'user', text }];
						}
					}
					
					// Text response from AI
					if (message.type === 'response.text.delta' && message.delta) {
						conversationMessages = [...conversationMessages, { role: 'assistant', text: message.delta }];
					}
					
					// Handle audio response from Cloudflare
					if (message.type === 'response.audio.delta' && message.delta) {
						await playAudioChunk(message.delta);
					} 
					
					// Response completed
					if (message.type === 'response.audio.done') {
						console.log('AI response complete');
						isProcessing = false;
					}
					
					// Handle errors
					if (message.type === 'error') {
						console.error('Cloudflare Realtime error:', message.error);
						isProcessing = false;
					}
				} catch (error) {
					console.error('Error processing message:', error);
				}
			};

		webSocket.onerror = (error) => {
			console.error('WebSocket error:', error);
			console.error('WebSocket URL was:', CLOUDFLARE_REALTIME_URL);
			isConnecting = false;
			isConnected = false;
		};

		webSocket.onclose = (event) => {
			console.log('Disconnected from Cloudflare Realtime');
			console.log('Close code:', event.code, 'Reason:', event.reason);
			isConnected = false;
			isConnecting = false;
			stopTimer();
			
			// Show helpful error message
			if (event.code === 1006) {
				alert('WebSocket connection failed. This feature requires deployment to Cloudflare Pages to work. WebSockets are not supported in local development.');
			}
		};			// Process audio from microphone and send to Cloudflare
			audioProcessor = audioContext.createScriptProcessor(4096, 1, 1);
			source.connect(audioProcessor);
			audioProcessor.connect(audioContext.destination);

			audioProcessor.onaudioprocess = (e) => {
				if (!isMuted && webSocket && webSocket.readyState === WebSocket.OPEN) {
					const inputData = e.inputBuffer.getChannelData(0);
					
					// Voice Activity Detection
					const rms = Math.sqrt(inputData.reduce((sum, val) => sum + val * val, 0) / inputData.length);
					const currentTime = Date.now();
					
					if (rms > SILENCE_THRESHOLD) {
						// User is speaking
						if (!isSpeaking) {
							console.log('Speech detected, starting audio buffer');
							isSpeaking = true;
						}
						silenceStart = null;
						
						// Send audio chunk
						const pcm16 = convertFloat32ToPCM16(inputData);
						const base64Audio = arrayBufferToBase64(pcm16);
						
						webSocket.send(JSON.stringify({
							type: 'input_audio_buffer.append',
							audio: base64Audio
						}));
					} else if (isSpeaking) {
						// Silence detected while speaking
						if (!silenceStart) {
							silenceStart = currentTime;
						} else if (currentTime - silenceStart > SILENCE_DURATION) {
							// Sustained silence - commit the buffer
							console.log('Silence detected, committing audio buffer');
							webSocket.send(JSON.stringify({
								type: 'input_audio_buffer.commit'
							}));
							isSpeaking = false;
							silenceStart = null;
						}
					}
				}
			};

		} catch (error) {
			console.error('Error starting voice chat:', error);
			isConnecting = false;
			alert('Failed to access microphone or connect to voice service. Please check your permissions.');
		}
	}

	function convertFloat32ToPCM16(float32Array: Float32Array): Int16Array {
		const pcm16 = new Int16Array(float32Array.length);
		for (let i = 0; i < float32Array.length; i++) {
			const s = Math.max(-1, Math.min(1, float32Array[i]));
			pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
		}
		return pcm16;
	}

	function arrayBufferToBase64(buffer: Int16Array): string {
		let binary = '';
		const bytes = new Uint8Array(buffer.buffer);
		for (let i = 0; i < bytes.byteLength; i++) {
			binary += String.fromCharCode(bytes[i]);
		}
		return btoa(binary);
	}

	async function playAudioChunk(base64Audio: string) {
		if (!audioContext) return;

		try {
			const binaryString = atob(base64Audio);
			const bytes = new Uint8Array(binaryString.length);
			for (let i = 0; i < binaryString.length; i++) {
				bytes[i] = binaryString.charCodeAt(i);
			}
			
			const pcm16 = new Int16Array(bytes.buffer);
			const float32 = new Float32Array(pcm16.length);
			for (let i = 0; i < pcm16.length; i++) {
				float32[i] = pcm16[i] / (pcm16[i] < 0 ? 0x8000 : 0x7FFF);
			}

			const audioBuffer = audioContext.createBuffer(1, float32.length, audioContext.sampleRate);
			audioBuffer.getChannelData(0).set(float32);

			const source = audioContext.createBufferSource();
			source.buffer = audioBuffer;
			source.connect(audioContext.destination);
			source.start();
		} catch (error) {
			console.error('Error playing audio chunk:', error);
		}
	}

	function startTimer() {
		elapsedTime = 0;
		timerInterval = window.setInterval(() => {
			elapsedTime++;
		}, 1000);
	}

	function stopTimer() {
		if (timerInterval) {
			clearInterval(timerInterval);
			timerInterval = null;
		}
		elapsedTime = 0;
	}

	function toggleMute() {
		isMuted = !isMuted;
		if (mediaStream) {
			mediaStream.getAudioTracks().forEach(track => {
				track.enabled = !isMuted;
			});
		}
	}

	function hangup() {
		cleanup();
		onClose();
	}

	function cleanup() {
		stopTimer();

		if (webSocket) {
			webSocket.close();
			webSocket = null;
		}

		if (audioProcessor) {
			audioProcessor.disconnect();
			audioProcessor = null;
		}

		if (mediaStream) {
			mediaStream.getTracks().forEach(track => track.stop());
			mediaStream = null;
		}

		if (audioContext) {
			audioContext.close();
			audioContext = null;
		}

		isConnected = false;
		isConnecting = false;
		isMuted = false;
		isProcessing = false;
		isSpeaking = false;
		silenceStart = null;
		conversationMessages = [];
	}

	function handleBackdropClick(event: MouseEvent) {
		// Only close on mobile (full screen mode)
		if (window.innerWidth < 768 && event.target === event.currentTarget) {
			hangup();
		}
	}
</script>

{#if isOpen}
	<!-- Mobile: Full screen overlay -->
	<div 
		class="voice-chat-container mobile"
		on:click={handleBackdropClick}
		transition:fade={{ duration: 200 }}
		role="dialog"
		aria-label="Voice chat session"
	>
		<div class="voice-chat-window mobile-window">
			<div class="voice-chat-header">
				<div class="status-indicator" class:connected={isConnected} class:connecting={isConnecting}>
					{isConnecting ? '🔄' : isConnected ? '🎤' : '⏸️'}
				</div>
				<div class="call-info">
					<div class="call-title">AI Voice Assistant</div>
					<div class="call-status">
						{#if isConnecting}
							Connecting...
						{:else if isConnected}
							{formatTime(elapsedTime)}
						{:else}
							Disconnected
						{/if}
					</div>
				</div>
			</div>

			<div class="voice-chat-body">
				<div class="avatar">
					<div class="avatar-pulse" class:active={isConnected && !isMuted}></div>
					<div class="avatar-icon">🤖</div>
				</div>

				<div class="connection-status">
					{#if isConnecting}
						<p>Establishing connection...</p>
					{:else if isConnected}
						<p class:processing={isProcessing}>
							{isProcessing ? 'AI is thinking...' : isSpeaking ? 'Listening...' : 'Ready to listen'}
						</p>
					{:else}
						<p>Not connected</p>
					{/if}
				</div>

				{#if conversationMessages.length > 0}
					<div class="conversation-display">
						{#each conversationMessages as message}
							<div class="message {message.role}">
								<span class="role-badge">{message.role === 'user' ? 'You' : 'AI'}</span>
								<span class="message-text">{message.text}</span>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<div class="voice-chat-controls">
				<button 
					class="control-button mute-button" 
					class:active={isMuted}
					on:click={toggleMute}
					disabled={!isConnected}
					title={isMuted ? 'Unmute' : 'Mute'}
				>
					{isMuted ? '🔇' : '🔊'}
				</button>

				<button 
					class="control-button hangup-button"
					on:click={hangup}
					title="Hang up"
				>
					📞
				</button>
			</div>
		</div>
	</div>

	<!-- Desktop: Bottom right floating window -->
	<div 
		class="voice-chat-container desktop"
		transition:fly={{ y: 100, duration: 300 }}
		role="dialog"
		aria-label="Voice chat session"
	>
		<div class="voice-chat-window desktop-window">
			<div class="voice-chat-header">
				<div class="status-indicator" class:connected={isConnected} class:connecting={isConnecting}>
					{isConnecting ? '🔄' : isConnected ? '🎤' : '⏸️'}
				</div>
				<div class="call-info">
					<div class="call-title">AI Voice Assistant</div>
					<div class="call-status">
						{#if isConnecting}
							Connecting...
						{:else if isConnected}
							{formatTime(elapsedTime)}
						{:else}
							Disconnected
						{/if}
					</div>
				</div>
			</div>

			<div class="voice-chat-body">
				<div class="avatar">
					<div class="avatar-pulse" class:active={isConnected && !isMuted}></div>
					<div class="avatar-icon">🤖</div>
				</div>
			</div>

			<div class="voice-chat-controls">
				<button 
					class="control-button mute-button" 
					class:active={isMuted}
					on:click={toggleMute}
					disabled={!isConnected}
					title={isMuted ? 'Unmute' : 'Mute'}
				>
					{isMuted ? '🔇' : '🔊'}
				</button>

				<button 
					class="control-button hangup-button"
					on:click={hangup}
					title="Hang up"
				>
					📞
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	/* Mobile styles */
	.voice-chat-container.mobile {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.95);
		z-index: 10000;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.voice-chat-container.mobile .mobile-window {
		width: 100%;
		height: 100%;
		border-radius: 0;
		display: flex;
		flex-direction: column;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	}

	/* Desktop styles */
	.voice-chat-container.desktop {
		position: fixed;
		bottom: 2rem;
		right: 2rem;
		z-index: 10000;
		display: none;
	}

	.voice-chat-window.desktop-window {
		width: 320px;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border-radius: 16px;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
		overflow: hidden;
		border: 2px solid rgba(255, 255, 255, 0.1);
	}

	@media (min-width: 768px) {
		.voice-chat-container.mobile {
			display: none;
		}

		.voice-chat-container.desktop {
			display: block;
		}
	}

	.voice-chat-header {
		padding: 1.25rem;
		display: flex;
		align-items: center;
		gap: 1rem;
		background: rgba(0, 0, 0, 0.2);
		backdrop-filter: blur(10px);
	}

	.status-indicator {
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.2);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.25rem;
	}

	.status-indicator.connecting {
		animation: pulse 1.5s ease-in-out infinite;
	}

	.status-indicator.connected {
		background: rgba(76, 175, 80, 0.3);
	}

	@keyframes pulse {
		0%, 100% { transform: scale(1); opacity: 1; }
		50% { transform: scale(1.1); opacity: 0.8; }
	}

	.call-info {
		flex: 1;
		color: white;
	}

	.call-title {
		font-weight: 600;
		font-size: 1rem;
		margin-bottom: 0.25rem;
	}

	.call-status {
		font-size: 0.875rem;
		opacity: 0.8;
	}

	.voice-chat-body {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		min-height: 200px;
	}

	.avatar {
		position: relative;
		width: 120px;
		height: 120px;
		margin-bottom: 1.5rem;
	}

	.avatar-pulse {
		position: absolute;
		inset: -10px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.3);
		opacity: 0;
		transition: opacity 0.3s;
	}

	.avatar-pulse.active {
		opacity: 1;
		animation: ripple 2s ease-out infinite;
	}

	@keyframes ripple {
		0% {
			transform: scale(0.8);
			opacity: 1;
		}
		100% {
			transform: scale(1.4);
			opacity: 0;
		}
	}

	.avatar-icon {
		position: relative;
		width: 100%;
		height: 100%;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.2);
		backdrop-filter: blur(10px);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 4rem;
		border: 3px solid rgba(255, 255, 255, 0.3);
	}

	.connection-status {
		text-align: center;
		color: white;
		font-size: 0.875rem;
		opacity: 0.9;
		margin-bottom: 1rem;
	}

	.connection-status p.processing {
		animation: pulse 1.5s ease-in-out infinite;
	}

	.conversation-display {
		width: 100%;
		max-height: 200px;
		overflow-y: auto;
		padding: 0.5rem;
		border-radius: 8px;
		background: rgba(0, 0, 0, 0.2);
		backdrop-filter: blur(10px);
	}

	.message {
		margin-bottom: 0.75rem;
		padding: 0.5rem;
		border-radius: 6px;
		background: rgba(255, 255, 255, 0.1);
		color: white;
		font-size: 0.8rem;
	}

	.message.user {
		background: rgba(103, 126, 234, 0.3);
		border-left: 3px solid rgba(103, 126, 234, 0.8);
	}

	.message.assistant {
		background: rgba(118, 75, 162, 0.3);
		border-left: 3px solid rgba(118, 75, 162, 0.8);
	}

	.role-badge {
		display: inline-block;
		font-weight: 600;
		font-size: 0.7rem;
		opacity: 0.8;
		margin-right: 0.5rem;
		text-transform: uppercase;
	}

	.message-text {
		display: block;
		margin-top: 0.25rem;
		line-height: 1.4;
	}

	.voice-chat-controls {
		padding: 1.5rem;
		display: flex;
		gap: 1rem;
		justify-content: center;
		background: rgba(0, 0, 0, 0.2);
		backdrop-filter: blur(10px);
	}

	.control-button {
		width: 60px;
		height: 60px;
		border-radius: 50%;
		border: none;
		font-size: 1.75rem;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(255, 255, 255, 0.2);
		backdrop-filter: blur(10px);
		border: 2px solid rgba(255, 255, 255, 0.3);
	}

	.control-button:hover:not(:disabled) {
		transform: scale(1.1);
		background: rgba(255, 255, 255, 0.3);
	}

	.control-button:active:not(:disabled) {
		transform: scale(0.95);
	}

	.control-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.mute-button.active {
		background: rgba(244, 67, 54, 0.3);
		border-color: rgba(244, 67, 54, 0.5);
	}

	.hangup-button {
		background: rgba(244, 67, 54, 0.3);
		border-color: rgba(244, 67, 54, 0.5);
		transform: rotate(135deg);
	}

	.hangup-button:hover {
		background: rgba(244, 67, 54, 0.5);
		transform: rotate(135deg) scale(1.1);
	}

	.hangup-button:active {
		transform: rotate(135deg) scale(0.95);
	}

	@media (min-width: 768px) {
		.voice-chat-body {
			min-height: auto;
		}

		.avatar {
			width: 100px;
			height: 100px;
			margin-bottom: 1rem;
		}

		.avatar-icon {
			font-size: 3rem;
		}

		.connection-status {
			display: none;
		}
	}
</style>
