import { Environment } from "./Environment";
import { Interpreter } from "./Interpreter";
import { FunctionStmt } from "./Stmt";
import { LoxCallable } from "./LoxCallable";
import { Return } from "./Return";

export class LoxFunction implements LoxCallable {
  constructor(
    private readonly declaration: FunctionStmt,
    private readonly closure: Environment
  ) {}

  arity(): number {
    return this.declaration.params.length;
  }
  call(interpreter: Interpreter, args: any[]): any {
    const environment = new Environment(this.closure);
    for (const i in this.declaration.params) {
      environment.define(this.declaration.params[i].lexeme, args[i]);
    }

    try {
      interpreter.executeBlock(this.declaration.body, environment);
    } catch (error) {
      if (error instanceof Return) {
        return error.value;
      }
    }

    return null;
  }
  toString(): string {
    return `<fn ${this.declaration.name.lexeme}>`;
  }
}
