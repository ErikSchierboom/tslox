import { Token } from "./Tokens";

export class ParseError extends Error {
  constructor(public line: number, message: string) {
    super(`[${line}] ${message}`);
  }

  static atToken(token: Token, message: string): ParseError {
    const expandedMessage =
      token.type == "EOF"
        ? `Error at end ${message}`
        : `Error at '${token.lexeme}' ${message}`;
    return new ParseError(token.line, expandedMessage);
  }
}
