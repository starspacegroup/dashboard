import { describe, expect, it } from 'vitest';
import { decryptState, encryptState } from './stateEncryption';

describe('dashboard state encryption', () => {
	it('round-trips credentials without exposing them in stored bytes', async () => {
		const plaintext = JSON.stringify({ token: 'sensitive-api-token' });
		const encrypted = await encryptState(plaintext, 'test-auth-secret');

		expect(encrypted).toMatch(/^enc:v1:/);
		expect(encrypted).not.toContain('sensitive-api-token');
		expect(await decryptState(encrypted, 'test-auth-secret')).toBe(plaintext);
	});

	it('reads legacy plaintext records for migration', async () => {
		expect(await decryptState('{"legacy":true}', 'test-auth-secret')).toBe('{"legacy":true}');
	});

	it('supports dashboard snapshots larger than the function argument limit', async () => {
		const plaintext = 'x'.repeat(200_000);
		const encrypted = await encryptState(plaintext, 'test-auth-secret');

		expect(await decryptState(encrypted, 'test-auth-secret')).toBe(plaintext);
	});

	it('rejects ciphertext encrypted with another secret', async () => {
		const encrypted = await encryptState('secret', 'first-secret');
		await expect(decryptState(encrypted, 'second-secret')).rejects.toThrow();
	});
});
