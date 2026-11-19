import { writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
try {
	writeFileSync(
		".env",
		"APP_URL=http://localhost:5173\nDATABASE_PATH=./data/free.db\nAUTH_SECRET=" +
			randomBytes(32).toString("hex") +
			"\n",
		{ flag: "wx", mode: 0o600 },
	);
	console.log("Created .env for local development.");
} catch (error) {
	if (error.code !== "EEXIST") throw error;
	console.log("Using existing .env.");
}
