import { Scanner } from "./Scanner";
import { ParseError } from "./ParseError";
import { Parser } from "./Parser";
import { RuntimeError } from "./RuntimeError";
import { Interpreter } from "./Interpreter";
import { Resolver } from "./Resolver";
import { Token } from "./Tokens";
import { Stmt } from "./Stmt";

export class Run {
  constructor(
    readonly parseErrors: ParseError[],
    readonly runtimeErrors: RuntimeError[],
    readonly tokens: Token[],
    readonly statements: Stmt[]
  ) {}
}

export class Runner {
  private static interpreter = new Interpreter();

  static parseErrors: ParseError[] = [];
  static runtimeErrors: RuntimeError[] = [];

  static run(source: string): Run {
    this.parseErrors = [];
    this.runtimeErrors = [];

    const scanner = new Scanner(source);
    const [tokens, scanErrors] = scanner.scanTokens();

    this.parseErrors.push(...scanErrors);
    if (this.parseErrors.length > 0)
      return new Run(this.parseErrors, this.runtimeErrors, tokens, []);

    const parser = new Parser(tokens);
    const [statements, parseErrors] = parser.parse();

    this.parseErrors.push(...parseErrors);
    if (this.parseErrors.length > 0)
      return new Run(this.parseErrors, this.runtimeErrors, tokens, statements);

    const resolver = new Resolver(this.interpreter);
    const resolveErrors = resolver.resolve(statements);

    this.parseErrors.push(...resolveErrors);
    if (this.parseErrors.length > 0)
      return new Run(this.parseErrors, this.runtimeErrors, tokens, statements);

    const runtimeError = this.interpreter.interpret(statements);
    if (runtimeError !== undefined) this.runtimeErrors.push(runtimeError);

    return new Run(this.parseErrors, this.runtimeErrors, tokens, statements);
  }
}
