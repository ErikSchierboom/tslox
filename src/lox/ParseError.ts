import { Span, Token } from "./Tokens";

export class ParseError extends Error {
  constructor(public span: Span, message: string) {
    super(`[line ${span.line}, col ${span.start}] ${message}`);
  }

  static atToken(token: Token, message: string): ParseError {
    const expandedMessage =
      token.type == "EOF"
        ? `Error at end: ${message}`
        : `Error at '${token.lexeme}': ${message}`;
    return new ParseError(token.span, expandedMessage);
  }
}
