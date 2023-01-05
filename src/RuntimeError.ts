import { Token } from "./Tokens";

export class RuntimeError extends Error {
  constructor(readonly token: Token, message: String) {
    super(message);
  }
}
