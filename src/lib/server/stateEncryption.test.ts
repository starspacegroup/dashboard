import { describe, expect, it } from 'vitest';
import {
	decryptState,
	encryptState,
	parseStateEncryptionConfig,
	type StateEncryptionConfig
} from './stateEncryption';

const ownerKey = 'dashboard-state:alice';
const config: StateEncryptionConfig = {
	activeVersion: '2026-08',
	keys: { '2026-08': 'test-dashboard-encryption-secret-0001' },
	legacySecrets: ['test-auth-secret']
};

async function encryptLegacy(plaintext: string, secret: string): Promise<string> {
	const encoder = new TextEncoder();
	const digest = await crypto.subtle.digest('SHA-256', encoder.encode(secret));
	const key = await crypto.subtle.importKey('raw', digest, 'AES-GCM', false, ['encrypt']);
	const iv = crypto.getRandomValues(new Uint8Array(12));
	const ciphertext = new Uint8Array(await crypto.subtle.encrypt(
		{ name: 'AES-GCM', iv },
		key,
		encoder.encode(plaintext)
	));
	const base64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
	return `enc:v1:${base64(iv)}:${base64(ciphertext)}`;
}

describe('dashboard state encryption', () => {
	it('round-trips credentials without exposing them in stored bytes', async () => {
		const plaintext = JSON.stringify({ token: 'sensitive-api-token' });
		const encrypted = await encryptState(plaintext, config, ownerKey);

		expect(encrypted).toMatch(/^enc:v2:2026-08:/);
		expect(encrypted).not.toContain('sensitive-api-token');
		expect(await decryptState(encrypted, config, ownerKey)).toEqual({
			plaintext,
			needsMigration: false
		});
	});

	it('marks legacy plaintext records for migration', async () => {
		expect(await decryptState('{"legacy":true}', config, ownerKey)).toEqual({
			plaintext: '{"legacy":true}',
			needsMigration: true
		});
	});

	it('decrypts pre-keyring ciphertext with a retained AUTH_SECRET fallback', async () => {
		const encrypted = await encryptLegacy('legacy ciphertext', 'test-auth-secret');

		expect(await decryptState(encrypted, config, ownerKey)).toEqual({
			plaintext: 'legacy ciphertext',
			needsMigration: true
		});
	});

	it('supports dashboard snapshots larger than the function argument limit', async () => {
		const plaintext = 'x'.repeat(200_000);
		const encrypted = await encryptState(plaintext, config, ownerKey);

		expect((await decryptState(encrypted, config, ownerKey)).plaintext).toBe(plaintext);
	});

	it('rejects ciphertext transplanted to another user', async () => {
		const encrypted = await encryptState('secret', config, ownerKey);
		await expect(decryptState(encrypted, config, 'dashboard-state:bob')).rejects.toThrow();
	});

	it('decrypts an old key version and marks it for re-encryption', async () => {
		const oldConfig: StateEncryptionConfig = {
			activeVersion: '2026-07',
			keys: { '2026-07': 'test-dashboard-encryption-secret-0000' },
			legacySecrets: []
		};
		const encrypted = await encryptState('secret', oldConfig, ownerKey);
		const rotatedConfig: StateEncryptionConfig = {
			activeVersion: '2026-08',
			keys: { ...oldConfig.keys, ...config.keys },
			legacySecrets: []
		};

		expect(await decryptState(encrypted, rotatedConfig, ownerKey)).toEqual({
			plaintext: 'secret',
			needsMigration: true
		});
	});

	it('uses AUTH_SECRET only as a fallback for unversioned legacy ciphertext', () => {
		const parsed = parseStateEncryptionConfig({
			AUTH_SECRET: 'legacy-auth-secret',
			DASHBOARD_STATE_ENCRYPTION_KEY_VERSION: 'v2',
			DASHBOARD_STATE_ENCRYPTION_KEYS: JSON.stringify({
				v2: 'test-dashboard-encryption-secret-0001'
			})
		});

		expect(parsed).toMatchObject({
			activeVersion: 'v2',
			legacySecrets: ['legacy-auth-secret']
		});
		expect(parsed?.keys.v2).toBe('test-dashboard-encryption-secret-0001');
	});

	it('rejects an inherited property name when the active key is absent', () => {
		expect(() => parseStateEncryptionConfig({
			DASHBOARD_STATE_ENCRYPTION_KEY_VERSION: 'constructor',
			DASHBOARD_STATE_ENCRYPTION_KEYS: JSON.stringify({
				v2: 'test-dashboard-encryption-secret-0001'
			})
		})).toThrow('Active dashboard encryption key is not configured');
	});

	it('does not decrypt an inherited ciphertext key version', async () => {
		await expect(
			decryptState('enc:v2:constructor:AA==:AA==', config, ownerKey)
		).rejects.toThrow('Dashboard encryption key constructor is not configured');
	});
});
