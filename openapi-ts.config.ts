import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
	client: "xhr",
	format: "prettier",
	input: "https://raw.githubusercontent.com/acdh-oeaw/noske-ubi9/main/openapi/openapi.yaml",
	output: "./src/client",
});
