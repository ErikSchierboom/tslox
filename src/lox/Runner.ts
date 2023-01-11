import { Scanner } from "./Scanner";
import { Token } from "./Tokens";
import { Parser } from "./Parser";
import { RuntimeError } from "./RuntimeError";
import { Interpreter } from "./Interpreter";
import { Resolver } from "./Resolver";

export class Runner {
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

    const resolver = new Resolver(this.interpreter);
    resolver.resolve(statements);

    if (this.hadError) return;

    this.interpreter.interpret(statements);
  }
}
