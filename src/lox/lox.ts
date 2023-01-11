import { exit, stdin, stdout } from "node:process";
import { readFileSync } from "node:fs";
import * as readline from "node:readline/promises";
import { Runner } from "./Runner";

function runFile(path: string): void {
  const source = readFileSync(path, { encoding: "utf-8" });
  Runner.run(source);

  if (Runner.parseErrors.length > 0) exit(65);
  if (Runner.runtimeErrors.length > 0) exit(70);
}

function runPrompt(): void {
  const rl = readline.createInterface({
    input: stdin,
    output: stdout,
    prompt: "> ",
  });
  rl.prompt();

  rl.on("line", (line) => {
    Runner.run(line);
    rl.prompt();
  }).on("close", () => process.exit());
}

const args = process.argv.slice(2);

if (args.length > 1) {
  console.error("Usage: lox [script]");
  exit(64);
}

if (args.length == 1) {
  runFile(args[0]);
} else {
  runPrompt();
}
