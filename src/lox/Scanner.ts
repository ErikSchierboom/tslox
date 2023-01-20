import { Literal, Span, Token, TokenType } from "./Tokens";

export class Scanner {
  static keywords: { [key: string]: TokenType } = {
    and: "AND",
    class: "CLASS",
    else: "ELSE",
    false: "FALSE",
    for: "FOR",
    fun: "FUN",
    if: "IF",
    nil: "NIL",
    or: "OR",
    print: "PRINT",
    return: "RETURN",
    super: "SUPER",
    this: "THIS",
    true: "TRUE",
    var: "VAR",
    while: "WHILE",
  };

  private start = 0;
  private current = 0;
  private line = 1;

  constructor(private readonly source: string) {}

  // TODO: consider generator function
  scanTokens(): Token[] {
    const tokens: Token[] = [];

    while (true) {
      const token = this.scanToken();
      tokens.push(token);

      if (token.type == "EOF") break;
    }

    return tokens;
  }

  scanToken(): Token {
    this.skipWhitespace();
    this.start = this.current;

    if (this.isAtEnd()) return this.makeToken("EOF");

    const c = this.advance();

    if (this.isAlpha(c)) return this.identifier();
    if (this.isDigit(c)) return this.number();

    switch (c) {
      case "(":
        return this.makeToken("TOKEN_LEFT_PAREN");
      case ")":
        return this.makeToken("RIGHT_PAREN");
      case "{":
        return this.makeToken("LEFT_BRACE");
      case "}":
        return this.makeToken("RIGHT_BRACE");
      case ";":
        return this.makeToken("SEMICOLON");
      case ",":
        return this.makeToken("COMMA");
      case ".":
        return this.makeToken("DOT");
      case "-":
        return this.makeToken("MINUS");
      case "+":
        return this.makeToken("PLUS");
      case "/":
        return this.makeToken("SLASH");
      case "*":
        return this.makeToken("STAR");
      case "!":
        return this.makeToken(this.match("=") ? "BANG_EQUAL" : "BANG");
      case "=":
        return this.makeToken(this.match("=") ? "EQUAL_EQUAL" : "EQUAL");
      case "<":
        return this.makeToken(this.match("=") ? "LESS_EQUAL" : "LESS");
      case ">":
        return this.makeToken(this.match("=") ? "GREATER_EQUAL" : "GREATER");
      case '"':
        return this.string();
    }

    return this.errorToken(`Unexpected character '${c}'.`);
  }

  skipWhitespace(): void {
    while (true) {
      const c = this.peek();

      switch (c) {
        case " ":
        case "\r":
        case "\t":
          this.advance();
          break;
        case "\n":
          this.line++;
          this.advance();
          break;
        case "/":
          if (this.peekNext() == "/") {
            while (this.peek() != "\n" && !this.isAtEnd()) this.advance();
          } else {
            return;
          }
          break;
        default:
          return;
      }
    }
  }

  private number(): Token {
    while (this.isDigit(this.peek())) this.advance();

    if (this.peek() == "." && this.isDigit(this.peekNext())) {
      this.advance();

      while (this.isDigit(this.peek())) this.advance();
    }

    return this.makeToken(
      "NUMBER",
      Number.parseFloat(this.source.substring(this.start, this.current))
    );
  }

  private identifier(): Token {
    while (this.isAlphaNumeric(this.peek())) this.advance();

    return this.makeToken(this.identifierType());
  }

  private identifierType(): TokenType {
    switch (this.source[this.start]) {
      case "a":
        return this.checkKeyword(1, 2, "nd", "AND");
      case "c":
        return this.checkKeyword(1, 4, "lass", "CLASS");
      case "e":
        return this.checkKeyword(1, 3, "lse", "ELSE");
      case "f":
        if (this.current - this.start > 1) {
          switch (this.source[this.start + 1]) {
            case "a":
              return this.checkKeyword(2, 3, "lse", "FALSE");
            case "o":
              return this.checkKeyword(2, 1, "r", "FOR");
            case "u":
              return this.checkKeyword(2, 1, "n", "FUN");
          }
        }
        break;
      case "i":
        return this.checkKeyword(1, 1, "f", "IF");
      case "n":
        return this.checkKeyword(1, 2, "il", "NIL");
      case "o":
        return this.checkKeyword(1, 1, "r", "OR");
      case "p":
        return this.checkKeyword(1, 4, "rint", "PRINT");
      case "r":
        return this.checkKeyword(1, 5, "eturn", "RETURN");
      case "s":
        return this.checkKeyword(1, 4, "uper", "SUPER");
      case "t":
        if (this.current - this.start > 1) {
          switch (this.source[this.start + 1]) {
            case "h":
              return this.checkKeyword(2, 2, "is", "THIS");
            case "r":
              return this.checkKeyword(2, 2, "ue", "TRUE");
          }
        }
        break;
      case "v":
        return this.checkKeyword(1, 2, "ar", "VAR");
      case "w":
        return this.checkKeyword(1, 4, "hile", "WHILE");
    }

    return "IDENTIFIER";
  }

  private string(): Token {
    while (this.peek() != '"' && !this.isAtEnd()) {
      if (this.peek() == "\n") this.line++;
      this.advance();
    }

    if (this.isAtEnd()) return this.errorToken("Unterminated string.");

    this.advance();

    const value = this.source.substring(this.start + 1, this.current - 1);
    return this.makeToken("STRING", value);
  }

  private checkKeyword(
    start: number,
    length: number,
    rest: string,
    type: TokenType
  ): TokenType {
    if (
      this.current - this.start == start + length &&
      this.source.substring(this.start + start, this.start + start + length) ===
        rest
    ) {
      return type;
    }

    return "IDENTIFIER";
  }

  private errorToken(message: string): Token {
    return this.makeToken("ERROR", message);
  }

  private makeToken(type: TokenType, literal: Literal = null): Token {
    const lexeme = this.source.substring(this.start, this.current);
    return {
      type,
      lexeme,
      literal,
      span: this.span(),
    };
  }

  private span(): Span {
    return {
      line: this.line,
      start: this.start,
      end: this.current,
    };
  }

  private match(expected: string): boolean {
    if (this.isAtEnd()) return false;
    if (this.source.charAt(this.current) != expected) return false;

    this.current++;
    return true;
  }

  private advance(): string {
    return this.source.charAt(this.current++);
  }

  private peek(): string {
    if (this.isAtEnd()) return "\0";
    return this.source.charAt(this.current);
  }

  private peekNext(): string {
    if (this.current + 1 >= this.source.length) return "\0";
    return this.source.charAt(this.current + 1);
  }

  private isAtEnd(): boolean {
    return this.current >= this.source.length;
  }

  private isAlpha(c: string): boolean {
    return (c >= "a" && c <= "z") || (c >= "A" && c <= "Z") || c == "_";
  }

  private isDigit(c: string): boolean {
    return c >= "0" && c <= "9";
  }

  private isAlphaNumeric(c: string): boolean {
    return this.isAlpha(c) || this.isDigit(c);
  }
}
