import { Scanner } from "./Scanner";
import { ParseError } from "./ParseError";
import { Parser } from "./Parser";
import { RuntimeError } from "./RuntimeError";
import { Interpreter, Variable } from "./Interpreter";
import { Resolver } from "./Resolver";
import { Token } from "./Tokens";
import { Stmt } from "./Stmt";

export type Run = Readonly<{
  parseErrors: ParseError[];
  runtimeErrors: RuntimeError[];
  tokens: Token[];
  statements: Stmt[];
  output: string[];
  variables: Variable[];
}>;

export class Runner {
  private static interpreter = new Interpreter();

  static parseErrors: ParseError[] = [];
  static runtimeErrors: RuntimeError[] = [];

  static run(source: string): Run {
    this.parseErrors = [];
    this.runtimeErrors = [];

    const scanner = new Scanner(source);
    const { tokens, errors: scanErrors } = scanner.scanTokens();

    this.parseErrors.push(...scanErrors);
    if (this.parseErrors.length > 0) return this.createRun(tokens);

    const parser = new Parser(tokens);
    const { statements, errors: parseErrors } = parser.parse();

    this.parseErrors.push(...parseErrors);
    if (this.parseErrors.length > 0) return this.createRun(tokens, statements);

    const resolver = new Resolver(this.interpreter);
    const { errors: resolveErrors } = resolver.resolve(statements);

    this.parseErrors.push(...resolveErrors);
    if (this.parseErrors.length > 0) return this.createRun(tokens, statements);

    const { output, variables, runtimeErrors } =
      this.interpreter.interpret(statements);
    this.runtimeErrors.push(...runtimeErrors);

    return this.createRun(tokens, statements, output, variables);
  }

  private static createRun(
    tokens: Token[],
    statements: Stmt[] = [],
    output: string[] = [],
    variables: Variable[] = []
  ): Run {
    return {
      parseErrors: this.parseErrors,
      runtimeErrors: this.runtimeErrors,
      tokens,
      statements,
      output,
      variables,
    };
  }
}
