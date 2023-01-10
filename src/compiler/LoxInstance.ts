import { LoxClass } from "./LoxClass";
import { RuntimeError } from "./RuntimeError";
import { Token } from "./Tokens";

export class LoxInstance {
  private readonly fields: Map<string, unknown> = new Map();

  constructor(readonly klass: LoxClass) {}

  get(name: Token): unknown {
    if (this.fields.has(name.lexeme)) {
      return this.fields.get(name.lexeme);
    }

    const method = this.klass.findMethod(name.lexeme);
    if (method !== undefined) return method.bind(this);

    throw new RuntimeError(name, `Undefined property '${name.lexeme}'.`);
  }

  set(name: Token, value: unknown): void {
    this.fields.set(name.lexeme, value);
  }

  toString() {
    return `${this.klass.name} instance`;
  }
}
