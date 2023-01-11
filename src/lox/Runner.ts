import { Scanner } from "./Scanner";
import { ParseError } from "./ParseError";
import { Parser } from "./Parser";
import { RuntimeError } from "./RuntimeError";
import { Interpreter } from "./Interpreter";
import { Resolver } from "./Resolver";

export class Runner {
  private static interpreter = new Interpreter();

  static parseErrors: ParseError[] = [];
  static runtimeErrors: RuntimeError[] = [];

  static run(source: string): void {
    this.parseErrors = [];
    this.runtimeErrors = [];

    const scanner = new Scanner(source);
    const [tokens, scanErrors] = scanner.scanTokens();

    this.parseErrors.push(...scanErrors);
    if (this.parseErrors.length > 0) return;

    const parser = new Parser(tokens);
    const [statements, parseErrors] = parser.parse();

    this.parseErrors.push(...parseErrors);
    if (this.parseErrors.length > 0) return;

    const resolver = new Resolver(this.interpreter);
    const resolveErrors = resolver.resolve(statements);

    this.parseErrors.push(...resolveErrors);
    if (this.parseErrors.length > 0) return;

    const runtimeError = this.interpreter.interpret(statements);
    if (runtimeError !== undefined) this.runtimeErrors.push(runtimeError);
  }
}
