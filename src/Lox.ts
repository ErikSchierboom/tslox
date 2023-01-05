import { exit, stdin, stdout } from "node:process";
import { readFileSync } from "node:fs";
import * as readline from "node:readline/promises";
import { Scanner } from "./Scanner";
import { BinaryExpr, GroupingExpr, LiteralExpr, UnaryExpr } from "./Ast";
import { Token } from "./Tokens";
import { AstPrinter } from "./AstPrinter";

export class Lox {
  static error(line: number, message: string): void {
    Lox.report(line, "", message);
  }

  static hadError = false;

  static report(line: number, where: string, message: string): void {
    console.error(`[line ${line}] Error${where} ${message}`);
    Lox.hadError = true;
  }

  static run(source: string): void {
    const scanner = new Scanner(source);
    const tokens = scanner.scanTokens(); // TODO: use iterator

    for (const token of tokens) {
      console.log(token);
    }
  }

  static runFile(path: string): void {
    Lox.run(readFileSync(path, { encoding: "utf-8" }));

    if (Lox.hadError) {
      exit(65);
    }
  }

  static runPrompt(): void {
    const rl = readline.createInterface({
      input: stdin,
      output: stdout,
      prompt: "> ",
    });
    rl.prompt();

    rl.on("line", (line) => {
      Lox.run(line);
      Lox.hadError = false;
      rl.prompt();
    }).on("close", () => process.exit());
  }

  static main(args: string[]): void {
    if (args.length > 3) {
      console.error("Usage: tslox [script]");
      exit(64);
    } else if (args.length == 1) {
      Lox.runFile(args[0]);
    } else {
      Lox.runPrompt();
    }
  }
}
