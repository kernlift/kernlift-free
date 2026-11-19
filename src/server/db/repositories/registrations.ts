import { db } from "./core";

export function registrationReport(days: number, now = new Date()) {
	const day = 86_400_000,
		end = Date.UTC(
			now.getUTCFullYear(),
			now.getUTCMonth(),
			now.getUTCDate() + 1,
		);
	const start = end - days * day,
		previous = start - days * day;
	const trend = Array.from({ length: days }, (_, i) => ({
		label: new Date(start + i * day).toISOString().slice(5, 10),
		today: 0,
		yesterday: 0,
	}));
	const members = db
			.prepare(
				"SELECT u.createdAt,COALESCE(p.country,'') country FROM user u LEFT JOIN profile p ON p.id=u.id",
			)
			.all(),
		countries = new Map<string, number>(),
		allCountries = new Map<string, number>();
	for (const u of members) {
		const country = String(u.country);
		allCountries.set(country, (allCountries.get(country) || 0) + 1);
		const t =
			typeof u.createdAt === "number"
				? u.createdAt < 1e11
					? u.createdAt * 1000
					: u.createdAt
				: Date.parse(String(u.createdAt));
		if (t < previous || t >= end || !Number.isFinite(t)) continue;
		if (t >= start) {
			trend[Math.floor((t - start) / day)].today++;
			countries.set(country, (countries.get(country) || 0) + 1);
		} else trend[Math.floor((t - previous) / day)].yesterday++;
	}
	const distribution = (rows: Map<string, number>) =>
		[...rows]
			.map(([country, count]) => ({ country, count }))
			.sort((a, b) => b.count - a.count || a.country.localeCompare(b.country));
	return {
		allCountries: distribution(allCountries),
		trend,
		total: members.length,
		newUsers: trend.reduce((n, r) => n + r.today, 0),
		openTickets: Number(
			db.prepare("SELECT COUNT(*) n FROM ticket WHERE status<>'closed'").get()
				?.n,
		),
		countries: distribution(countries),
	};
}
