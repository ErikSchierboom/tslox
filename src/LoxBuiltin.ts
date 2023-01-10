import { Interpreter } from "./Interpreter";
import { LoxCallable } from "./LoxCallable";

export class LoxBuiltin implements LoxCallable {
  constructor(
    private readonly callbackArity: number,
    private readonly callback: (interpreter: Interpreter, args: any[]) => any
  ) {}

  arity(): number {
    return this.callbackArity;
  }

  call(interpreter: Interpreter, args: any[]): any {
    return this.callback(interpreter, args);
  }

  toString(): string {
    return "<native fn>";
  }
}
