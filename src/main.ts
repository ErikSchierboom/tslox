import { stdin as input, stdout as output, exit } from "node:process";
import { readFileSync } from "node:fs";
import * as readline from "node:readline/promises";
import { Scanner } from "./Scanner";

export class Lox {
  static error(line: number, message: string) {
    Lox.report(line, "", message);
  }

  static hadError = false;

  static report(line: number, where: string, message: string) {
    console.error(`[line ${line}] Error${where}" ${message}`);
    Lox.hadError = true;
  }

  static run(source: string) {
    const scanner = new Scanner(source);
    const tokens = scanner.scanTokens();

    for (const token of tokens) {
      console.log(token);
    }
  }

  static runFile(path: string) {
    Lox.run(readFileSync(path, { encoding: "utf-8" }));

    if (Lox.hadError) {
      exit(65);
    }
  }

  static async runPrompt() {
    const rl = readline.createInterface({ input, output, prompt: "> " });
    rl.prompt();

    rl.on("line", (line) => {
      Lox.run(line);
      Lox.hadError = false;
      rl.prompt();
    }).on("close", () => {
      process.exit(0);
    });
  }

  static main(args: string[]) {
    if (args.length > 3) {
      console.error("Usage: tslox [script]\n");
      exit(64);
    } else if (args.length == 1) {
      Lox.runFile(args[0]);
    } else {
      Lox.runPrompt();
    }
  }
}

Lox.main(process.argv.slice(2));
