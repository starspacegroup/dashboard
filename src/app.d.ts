// See https://kit.svelte.dev/docs/types#app

/// <reference types="@types/google.maps" />

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			auth: () => Promise<{
				user?: {
					name?: string | null;
					email?: string | null;
					image?: string | null;
					login?: string;
				};
				accessToken?: string;
				error?: string;
			} | null>;
		}
		// interface PageData {}
		// interface PageState {}
		interface Platform {
			env?: {
				DASHBOARD_KV?: {
					get(key: string, type?: 'text'): Promise<string | null>;
					put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
					delete(key: string): Promise<void>;
				};
			};
		}
	}
}

export { };
