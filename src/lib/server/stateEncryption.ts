const LEGACY_PREFIX = 'enc:v1:';
const PREFIX = 'enc:v2:';
const VERSION_PATTERN = /^[A-Za-z0-9._-]+$/;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export interface StateEncryptionConfig {
	activeVersion: string;
	keys: Readonly<Record<string, string>>;
	legacySecrets: readonly string[];
}

export interface DecryptedState {
	plaintext: string;
	needsMigration: boolean;
}

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
	const digest = await crypto.subtle.digest('SHA-256', encoder.encode(secret));
	return crypto.subtle.importKey('raw', digest, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

function additionalData(ownerKey: string, version: string): ArrayBuffer {
	return encoder.encode(`dashboard-state-encryption:${version}:${ownerKey}`).buffer as ArrayBuffer;
}

function parseKeys(raw: string): Record<string, string> {
	const parsed: unknown = JSON.parse(raw);
	if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
		throw new Error('DASHBOARD_STATE_ENCRYPTION_KEYS must be a JSON object');
	}

	const keys: Record<string, string> = {};
	for (const [version, value] of Object.entries(parsed)) {
		if (!VERSION_PATTERN.test(version) || typeof value !== 'string' || value.trim().length < 32) {
			throw new Error('Dashboard encryption key versions and values are invalid');
		}
		keys[version] = value.trim();
	}
	return keys;
}

function parseLegacySecrets(raw: string | undefined): string[] {
	if (!raw?.trim()) return [];
	const parsed: unknown = JSON.parse(raw);
	if (!Array.isArray(parsed) || parsed.some((value) => typeof value !== 'string' || !value.trim())) {
		throw new Error('DASHBOARD_STATE_LEGACY_AUTH_SECRETS must be a JSON string array');
	}
	return parsed.map((value) => (value as string).trim());
}

export function parseStateEncryptionConfig(
	environment: Partial<Record<string, string>>
): StateEncryptionConfig | null {
	const activeVersion = environment.DASHBOARD_STATE_ENCRYPTION_KEY_VERSION?.trim();
	const rawKeys = environment.DASHBOARD_STATE_ENCRYPTION_KEYS?.trim();
	if (!activeVersion || !rawKeys) return null;
	if (!VERSION_PATTERN.test(activeVersion)) throw new Error('Invalid active encryption key version');

	const keys = parseKeys(rawKeys);
	if (!keys[activeVersion]) throw new Error('Active dashboard encryption key is not configured');

	const legacySecrets = parseLegacySecrets(environment.DASHBOARD_STATE_LEGACY_AUTH_SECRETS);
	const currentAuthSecret = environment.AUTH_SECRET?.trim();
	if (currentAuthSecret) legacySecrets.unshift(currentAuthSecret);

	return {
		activeVersion,
		keys,
		legacySecrets: [...new Set(legacySecrets)]
	};
}

export async function encryptState(
	plaintext: string,
	config: StateEncryptionConfig,
	ownerKey: string
): Promise<string> {
	const version = config.activeVersion;
	const secret = config.keys[version];
	if (!secret) throw new Error(`Dashboard encryption key ${version} is not configured`);

	const iv = crypto.getRandomValues(new Uint8Array(12));
	const ciphertext = await crypto.subtle.encrypt(
		{ name: 'AES-GCM', iv, additionalData: additionalData(ownerKey, version) },
		await deriveKey(secret),
		encoder.encode(plaintext)
	);
	return `${PREFIX}${version}:${encode(iv)}:${encode(new Uint8Array(ciphertext))}`;
}

async function decryptLegacy(value: string, secrets: readonly string[]): Promise<string> {
	const parts = value.slice(LEGACY_PREFIX.length).split(':');
	if (parts.length !== 2 || !parts[0] || !parts[1]) {
		throw new Error('Invalid legacy encrypted dashboard state');
	}

	for (const secret of secrets) {
		try {
			const plaintext = await crypto.subtle.decrypt(
				{ name: 'AES-GCM', iv: decode(parts[0]) },
				await deriveKey(secret),
				decode(parts[1])
			);
			return decoder.decode(plaintext);
		} catch {
			// Try the next explicitly retained legacy authentication secret.
		}
	}
	throw new Error('No configured legacy secret can decrypt dashboard state');
}

export async function decryptState(
	value: string,
	config: StateEncryptionConfig,
	ownerKey: string
): Promise<DecryptedState> {
	if (!value.startsWith('enc:')) return { plaintext: value, needsMigration: true };
	if (value.startsWith(LEGACY_PREFIX)) {
		return { plaintext: await decryptLegacy(value, config.legacySecrets), needsMigration: true };
	}
	if (!value.startsWith(PREFIX)) throw new Error('Unsupported encrypted dashboard state version');

	const parts = value.slice(PREFIX.length).split(':');
	if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) {
		throw new Error('Invalid encrypted dashboard state');
	}
	const [version, iv, ciphertext] = parts;
	const secret = config.keys[version];
	if (!secret) throw new Error(`Dashboard encryption key ${version} is not configured`);

	const plaintext = await crypto.subtle.decrypt(
		{ name: 'AES-GCM', iv: decode(iv), additionalData: additionalData(ownerKey, version) },
		await deriveKey(secret),
		decode(ciphertext)
	);
	return {
		plaintext: decoder.decode(plaintext),
		needsMigration: version !== config.activeVersion
	};
}
