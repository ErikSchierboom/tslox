export type TokenType =
  // Single-character tokens
  | "LEFT_PAREN"
  | "RIGHT_PAREN"
  | "LEFT_BRACE"
  | "RIGHT_BRACE"
  | "COMMA"
  | "DOT"
  | "MINUS"
  | "PLUS"
  | "SEMICOLON"
  | "SLASH"
  | "STAR"
  // One or two character tokens
  | "BANG"
  | "BANG_EQUAL"
  | "EQUAL"
  | "EQUAL_EQUAL"
  | "GREATER"
  | "GREATER_EQUAL"
  | "LESS"
  | "LESS_EQUAL"
  // Literals
  | "IDENTIFIER"
  | "STRING"
  | "NUMBER"
  // Keywords
  | "AND"
  | "CLASS"
  | "ELSE"
  | "FALSE"
  | "FUN"
  | "FOR"
  | "IF"
  | "NIL"
  | "OR"
  | "PRINT"
  | "RETURN"
  | "SUPER"
  | "THIS"
  | "TRUE"
  | "VAR"
  | "WHILE"
  // Special
  | "EOF";

export type Literal = number | boolean | string | null | undefined;

export type Span = {
  readonly line: number;
  readonly start: number;
  readonly end: number;
};

export type Token = {
  readonly type: TokenType;
  readonly lexeme: string;
  readonly literal: Literal;
  readonly span: Span;
};
