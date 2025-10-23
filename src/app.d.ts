// See https://kit.svelte.dev/docs/types#app

/// <reference types="@types/google.maps" />

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			getSession: () => Promise<{
				user?: {
					name?: string | null;
					email?: string | null;
					image?: string | null;
					login?: string;
				};
			} | null>;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export { };
