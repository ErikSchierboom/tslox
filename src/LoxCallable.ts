import { Interpreter } from "./Interpreter";

export interface LoxCallable {
  arity(): number;
  call(interpreter: Interpreter, args: any[]): any;
}

// TODO: consider making LoxCallable an abstract class
// to not need this type guard
export function isLoxCallable(obj: LoxCallable): obj is LoxCallable {
  return "call" in obj && "arity" in obj;
}
