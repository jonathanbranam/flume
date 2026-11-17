#!/usr/bin/env node
// Node runs the TypeScript sources directly (type stripping), so a git pull needs no build.
import { main } from "../src/cli/main.ts";

process.exitCode = await main(process.argv.slice(2));
