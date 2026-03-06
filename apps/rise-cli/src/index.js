import { createDefaultSustainConfig } from "@superise/sustain";

const config = createDefaultSustainConfig();
console.log(JSON.stringify({ app: "rise-cli", sustain: config.enabled }, null, 2));
