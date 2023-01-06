import { Interpreter } from "./Interpreter";
import { LoxCallable } from "./LoxCallable";
import { LoxFunction } from "./LoxFunction";
import { LoxInstance } from "./LoxInstance";

export class LoxClass implements LoxCallable {
  constructor(
    readonly name: string,
    readonly methods: Map<string, LoxFunction>
  ) {}

  arity(): number {
    const initializer = this.findMethod("init");
    return initializer === undefined ? 0 : initializer.arity();
  }

  call(interpreter: Interpreter, args: any[]) {
    const instance = new LoxInstance(this);
    const initializer = this.findMethod("init");
    if (initializer !== undefined) {
      initializer.bind(instance).call(interpreter, args);
    }

    return instance;
  }

  findMethod(name: string): LoxFunction | undefined {
    return this.methods.get(name);
  }

  toString(): string {
    return this.name;
  }
}
