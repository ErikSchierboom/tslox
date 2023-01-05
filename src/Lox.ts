import { exit, stdin, stdout } from "node:process";
import { readFileSync } from "node:fs";
import * as readline from "node:readline/promises";
import { Scanner } from "./Scanner";
import { Token } from "./Tokens";
import { Parser } from "./Parser";
import { RuntimeError } from "./RuntimeError";
import { Interpreter } from "./Interpreter";

export class Lox {
  private static interpreter = new Interpreter();

  static hadError = false;
  static hadRuntimeError = false;

  static runtimeError(error: RuntimeError) {
    console.error(error.message);
    console.error(`[line ${error.token.line}]`);
    this.hadRuntimeError = true;
  }

  static error(context: number | Token, message: string): void {
    if (context instanceof Token) {
      if (context.type == "EOF") {
        this.report(context.line, " at end", message);
      } else {
        this.report(context.line, ` at '${context.lexeme}'`, message);
      }
    } else {
      this.report(context, "", message);
    }
  }

  static report(line: number, where: string, message: string): void {
    console.error(`[line ${line}] Error${where} ${message}`);
    this.hadError = true;
  }

  static run(source: string): void {
    const scanner = new Scanner(source);
    const tokens = scanner.scanTokens(); // TODO: use iterator

    const parser = new Parser(tokens);
    const statements = parser.parse();

    if (this.hadError) return;

    this.interpreter.interpret(statements);
  }

  static runFile(path: string): void {
    this.run(readFileSync(path, { encoding: "utf-8" }));

    if (this.hadError) exit(65);
    if (this.hadRuntimeError) exit(70);
  }

  static runPrompt(): void {
    const rl = readline.createInterface({
      input: stdin,
      output: stdout,
      prompt: "> ",
    });
    rl.prompt();

    rl.on("line", (line) => {
      this.run(line);
      this.hadError = false;
      rl.prompt();
    }).on("close", () => process.exit());
  }

  static main(args: string[]): void {
    if (args.length > 3) {
      console.error("Usage: tslox [script]");
      exit(64);
    } else if (args.length == 1) {
      this.runFile(args[0]);
    } else {
      this.runPrompt();
    }
  }
}
