import { RuntimeError } from "./RuntimeError";
import { Token } from "./Tokens";

export class Environment {
  private readonly values = new Map<string, unknown>();

  constructor(readonly enclosing: Environment | null = null) {}

  define(name: string, value: unknown): void {
    this.values.set(name, value);
  }

  assign(name: Token, value: unknown): void {
    if (this.values.has(name.lexeme)) {
      this.values.set(name.lexeme, value);
      return;
    }

    if (this.enclosing !== null) {
      this.enclosing.assign(name, value);
      return;
    }

    throw new RuntimeError(name, `Undefined variable '${name.lexeme}'.`);
  }

  assignAt(distance: number, name: Token, value: unknown): unknown {
    return this.ancestor(distance).values.set(name.lexeme, value);
  }

  get(name: Token): unknown {
    if (this.values.has(name.lexeme)) {
      return this.values.get(name.lexeme);
    }

    if (this.enclosing !== null) return this.enclosing.get(name);

    throw new RuntimeError(name, `Undefined variable '${name.lexeme}'.`);
  }

  getAt(distance: number, name: string): unknown {
    return this.ancestor(distance).values.get(name);
  }

  private ancestor(distance: number): Environment {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let environment: Environment = this;
    for (let i = 0; i < distance; i++) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      environment = environment.enclosing!;
    }
    return environment;
  }
}
