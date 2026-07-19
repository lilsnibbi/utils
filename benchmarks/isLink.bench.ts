import { bench, run } from "mitata";
import { isLink } from "../src/helpers/isLink";

// Create mixed data to benchmark
const inputs = [
	"https://google.com",
	"http://localhost:3000",
	"https://api.github.com/users/oven-sh/repos?sort=updated&direction=desc#readme",
	"ftp://example.com/file.zip",
	"mailto:test@example.com",
	"google.com",
	"not a link",
	"",
	"http://",
	"https://",
	"://invalid",
	" https://google.com ",
	"https:// google.com",
	"https://xn--bcher-kva.example",
	"https://münchen.de",
	"https://🚀.com",
	"plain text message with some words and no links at all",
	"just another chat message without any urls",
	"  HTTP://EXAMPLE.COM",
	"a1+-.://example.com",
];

bench("isLink", () => {
	for (let i = 0; i < inputs.length; i++) {
		isLink(inputs[i] ?? "");
	}
});

await run();
