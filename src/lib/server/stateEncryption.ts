const PREFIX = 'enc:v1:';

function encode(bytes: Uint8Array): string {
	let binary = '';
	for (let offset = 0; offset < bytes.length; offset += 0x8000) {
		binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
	}
	return btoa(binary);
}

function decode(value: string): ArrayBuffer {
	return Uint8Array.from(atob(value), (char) => char.charCodeAt(0)).buffer as ArrayBuffer;
}

async function deriveKey(secret: string): Promise<CryptoKey> {
	const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret));
	return crypto.subtle.importKey('raw', digest, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

export async function encryptState(plaintext: string, secret: string): Promise<string> {
	const iv = crypto.getRandomValues(new Uint8Array(12));
	const ciphertext = await crypto.subtle.encrypt(
		{ name: 'AES-GCM', iv },
		await deriveKey(secret),
		new TextEncoder().encode(plaintext)
	);
	return `${PREFIX}${encode(iv)}:${encode(new Uint8Array(ciphertext))}`;
}

export async function decryptState(value: string, secret: string): Promise<string> {
	// Existing KV records predate encryption and remain readable until next write.
	if (!value.startsWith(PREFIX)) return value;
	const [iv, ciphertext] = value.slice(PREFIX.length).split(':');
	if (!iv || !ciphertext) throw new Error('Invalid encrypted dashboard state');
	const plaintext = await crypto.subtle.decrypt(
		{ name: 'AES-GCM', iv: decode(iv) },
		await deriveKey(secret),
		decode(ciphertext)
	);
	return new TextDecoder().decode(plaintext);
}
