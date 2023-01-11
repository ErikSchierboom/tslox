import { Environment } from "./Environment";
import { Interpreter } from "./Interpreter";
import { FunctionStmt } from "./Stmt";
import { LoxCallable } from "./LoxCallable";
import { Return } from "./Return";
import { LoxInstance } from "./LoxInstance";

export class LoxFunction implements LoxCallable {
  constructor(
    private readonly declaration: FunctionStmt,
    private readonly closure: Environment,
    private readonly isInitializer: boolean
  ) {}

  bind(instance: LoxInstance): LoxFunction {
    const environment = new Environment(this.closure);
    environment.define("this", instance);
    return new LoxFunction(this.declaration, environment, this.isInitializer);
  }

  arity(): number {
    return this.declaration.params.length;
  }

  call(interpreter: Interpreter, args: unknown[]): unknown {
    const environment = new Environment(this.closure);
    for (const i in this.declaration.params) {
      environment.define(this.declaration.params[i].lexeme, args[i]);
    }

    try {
      interpreter.executeBlock(this.declaration.body, environment);
    } catch (error) {
      if (error instanceof Return) {
        if (this.isInitializer) return this.closure.getAt(0, "this");

        return error.value;
      }
    }

    if (this.isInitializer) return this.closure.getAt(0, "this");
    return null;
  }

  toString(): string {
    return `<fn ${this.declaration.name.lexeme}>`;
  }
}
