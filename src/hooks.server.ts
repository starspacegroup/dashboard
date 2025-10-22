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

interface ExtendedSession {
	user?: ExtendedUser;
	accessToken?: string;
}

export const { handle } = SvelteKitAuth({
	providers: [
		GitHub({
			clientId: GITHUB_ID,
			clientSecret: GITHUB_SECRET,
			authorization: {
				params: {
					scope: 'read:user user:email read:org repo read:project'
				}
			}
		})
	],
	secret: AUTH_SECRET,
	trustHost: true,
	callbacks: {
		async session({ session, token }) {
			if (session.user && token) {
				// Add GitHub username and access token to session
				(session.user as ExtendedUser).login = token.login as string;
				(session as ExtendedSession).accessToken = token.accessToken as string;
			}
			return session;
		},
		async jwt({ token, profile, account }) {
			if (profile) {
				token.login = (profile as ExtendedProfile).login;
			}
			if (account) {
				token.accessToken = account.access_token;
			}
			return token;
		}
	}
});
