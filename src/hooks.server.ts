import { SvelteKitAuth } from '@auth/sveltekit';
import GitHub from '@auth/core/providers/github';
import { env } from '$env/dynamic/private';

const { GITHUB_ID = '', GITHUB_SECRET = '', AUTH_SECRET = '' } = env;

interface ExtendedUser {
	name?: string | null;
	email?: string | null;
	image?: string | null;
	login?: string;
}

interface ExtendedProfile {
	login?: string;
}

export const { handle } = SvelteKitAuth({
	providers: [
		GitHub({
			clientId: GITHUB_ID,
			clientSecret: GITHUB_SECRET
		})
	],
	secret: AUTH_SECRET,
	trustHost: true,
	callbacks: {
		async session({ session, token }) {
			if (session.user && token) {
				// Add GitHub username to session
				(session.user as ExtendedUser).login = token.login as string;
			}
			return session;
		},
		async jwt({ token, profile }) {
			if (profile) {
				token.login = (profile as ExtendedProfile).login;
			}
			return token;
		}
	}
});
