import { Interpreter } from "./Interpreter";

export interface LoxCallable {
  arity(): number;
  call(interpreter: Interpreter, args: unknown[]): unknown;
}

// TODO: consider making LoxCallable an abstract class
// to not need this type guard
export function isLoxCallable(obj: unknown): obj is LoxCallable {
  return (
    obj !== null &&
    obj !== undefined &&
    typeof obj === "object" &&
    "call" in obj &&
    "arity" in obj
  );
}
