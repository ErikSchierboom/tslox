import { Interpreter } from "./Interpreter";

export interface LoxCallable {
  arity(): number;
  call(interpreter: Interpreter, args: any[]): any;
}

export function isLoxCallable(obj: LoxCallable): obj is LoxCallable {
  return "call" in obj && "arity" in obj;
}
