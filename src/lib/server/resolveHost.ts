/**
 * Resolve a hostname to its IPv4 and IPv6 addresses.
 *
 * The app runs on Cloudflare Pages (Workers runtime), which has no `node:dns`
 * and no socket API to ask the system resolver. The one resolver a Worker can
 * reach is DNS-over-HTTPS through `fetch`, so that is what this uses.
 *
 * Limit: the later `fetch` to the site resolves the name again on its own, so a
 * DNS server that answers differently the second time (rebinding) can still
 * slip through this check. Cloudflare's runtime refuses to connect to private
 * and loopback addresses itself; this check is the application-level layer.
 */

const DOH_URL = 'https://cloudflare-dns.com/dns-query';
const DOH_TIMEOUT = 5_000;
const TYPE_A = 1;
const TYPE_AAAA = 28;

async function query(name: string, type: 'A' | 'AAAA', wanted: number): Promise<string[]> {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), DOH_TIMEOUT);
	try {
		const res = await fetch(`${DOH_URL}?name=${encodeURIComponent(name)}&type=${type}`, {
			headers: { Accept: 'application/dns-json' },
			signal: controller.signal
		});
		if (!res.ok) throw new Error(`DNS answered HTTP ${res.status}`);
		const body = (await res.json()) as { Answer?: { type: number; data: string }[] };
		// A CNAME chain comes back as extra records of another type; keep only addresses.
		return (body.Answer ?? []).filter((a) => a.type === wanted).map((a) => a.data);
	} finally {
		clearTimeout(timer);
	}
}

/** Every A and AAAA address for `hostname`. Throws if the lookup itself fails. */
export async function resolveHost(hostname: string): Promise<string[]> {
	const [v4, v6] = await Promise.all([
		query(hostname, 'A', TYPE_A),
		query(hostname, 'AAAA', TYPE_AAAA)
	]);
	return [...v4, ...v6];
}
