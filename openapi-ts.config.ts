import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
	client: "xhr",
	base: "https://diarium-noske.acdh-dev.oeaw.ac.at",
	format: "prettier",
	input: "https://raw.githubusercontent.com/acdh-oeaw/noske-ubi9/main/openapi/openapi.yaml",
	output: "./src/client",
});
