export type TokenType =
  // Single-character tokens
  | "TOKEN_LEFT_PAREN"
  | "TOKEN_RIGHT_PAREN"
  | "TOKEN_LEFT_BRACE"
  | "TOKEN_RIGHT_BRACE"
  | "TOKEN_COMMA"
  | "TOKEN_DOT"
  | "TOKEN_MINUS"
  | "TOKEN_PLUS"
  | "TOKEN_SEMICOLON"
  | "TOKEN_SLASH"
  | "TOKEN_STAR"
  // One or two character tokens
  | "TOKEN_BANG"
  | "TOKEN_BANG_EQUAL"
  | "TOKEN_EQUAL"
  | "TOKEN_EQUAL_EQUAL"
  | "TOKEN_GREATER"
  | "TOKEN_GREATER_EQUAL"
  | "TOKEN_LESS"
  | "TOKEN_LESS_EQUAL"
  // Literals
  | "TOKEN_IDENTIFIER"
  | "TOKEN_STRING"
  | "TOKEN_NUMBER"
  // Keywords
  | "TOKEN_AND"
  | "TOKEN_CLASS"
  | "TOKEN_ELSE"
  | "TOKEN_FALSE"
  | "TOKEN_FUN"
  | "TOKEN_FOR"
  | "TOKEN_IF"
  | "TOKEN_NIL"
  | "TOKEN_OR"
  | "TOKEN_PRINT"
  | "TOKEN_RETURN"
  | "TOKEN_SUPER"
  | "TOKEN_THIS"
  | "TOKEN_TRUE"
  | "TOKEN_VAR"
  | "TOKEN_WHILE"
  // Special
  | "TOKEN_ERROR"
  | "TOKEN_EOF";

export type Literal = number | boolean | string | null | undefined;

export type Span = Readonly<{
  line: number;
  start: number;
  end: number;
}>;

export type Token = Readonly<{
  type: TokenType;
  lexeme: string;
  literal: Literal;
  span: Span;
}>;
