import { Expr, GroupingExpr, LiteralExpr, LogicalExpr } from "./Expr";
import { ParseError } from "./ParseError";
import { Token, TokenType } from "./Tokens";

export type Precedence =
  | "PREC_NONE"
  | "PREC_ASSIGNMENT" // =
  | "PREC_OR" // or
  | "PREC_AND" // and
  | "PREC_EQUALITY" // == !=
  | "PREC_COMPARISON" // < > <= >=
  | "PREC_TERM" // + -
  | "PREC_FACTOR" // * /
  | "PREC_UNARY" // ! -
  | "PREC_CALL" // . ()
  | "PREC_PRIMARY";

export class Parser {
  private rules: { [key in TokenType]: ParseRule } = {
    TOKEN_LEFT_PAREN: this.makeRule(this.grouping, null, "PREC_NONE"),
    TOKEN_RIGHT_PAREN: this.makeRule(null, null, "PREC_NONE"),
    TOKEN_LEFT_BRACE: this.makeRule(null, null, "PREC_NONE"),
    TOKEN_RIGHT_BRACE: this.makeRule(null, null, "PREC_NONE"),
    TOKEN_COMMA: this.makeRule(null, null, "PREC_NONE"),
    TOKEN_DOT: this.makeRule(null, null, "PREC_NONE"),
    TOKEN_MINUS: this.makeRule(this.unary, this.binary, "PREC_TERM"),
    TOKEN_PLUS: this.makeRule(null, this.binary, "PREC_TERM"),
    TOKEN_SEMICOLON: this.makeRule(null, null, "PREC_NONE"),
    TOKEN_SLASH: this.makeRule(null, this.binary, "PREC_FACTOR"),
    TOKEN_STAR: this.makeRule(null, this.binary, "PREC_FACTOR"),
    TOKEN_BANG: this.makeRule(this.unary, null, "PREC_NONE"),
    TOKEN_BANG_EQUAL: this.makeRule(null, this.binary, "PREC_EQUALITY"),
    TOKEN_EQUAL: this.makeRule(null, null, "PREC_NONE"),
    TOKEN_EQUAL_EQUAL: this.makeRule(null, this.binary, "PREC_EQUALITY"),
    TOKEN_GREATER: this.makeRule(null, this.binary, "PREC_COMPARISON"),
    TOKEN_GREATER_EQUAL: this.makeRule(null, this.binary, "PREC_COMPARISON"),
    TOKEN_LESS: this.makeRule(null, this.binary, "PREC_COMPARISON"),
    TOKEN_LESS_EQUAL: this.makeRule(null, this.binary, "PREC_COMPARISON"),
    TOKEN_IDENTIFIER: this.makeRule(null, null, "PREC_NONE"),
    TOKEN_STRING: this.makeRule(this.string, null, "PREC_NONE"),
    TOKEN_NUMBER: this.makeRule(this.number, null, "PREC_NONE"),
    TOKEN_AND: this.makeRule(null, null, "PREC_NONE"),
    TOKEN_CLASS: this.makeRule(null, null, "PREC_NONE"),
    TOKEN_ELSE: this.makeRule(null, null, "PREC_NONE"),
    TOKEN_FALSE: this.makeRule(this.literal, null, "PREC_NONE"),
    TOKEN_FOR: this.makeRule(null, null, "PREC_NONE"),
    TOKEN_FUN: this.makeRule(null, null, "PREC_NONE"),
    TOKEN_IF: this.makeRule(null, null, "PREC_NONE"),
    TOKEN_NIL: this.makeRule(this.literal, null, "PREC_NONE"),
    TOKEN_OR: this.makeRule(null, null, "PREC_NONE"),
    TOKEN_PRINT: this.makeRule(null, null, "PREC_NONE"),
    TOKEN_RETURN: this.makeRule(null, null, "PREC_NONE"),
    TOKEN_SUPER: this.makeRule(null, null, "PREC_NONE"),
    TOKEN_THIS: this.makeRule(null, null, "PREC_NONE"),
    TOKEN_TRUE: this.makeRule(this.literal, null, "PREC_NONE"),
    TOKEN_VAR: this.makeRule(null, null, "PREC_NONE"),
    TOKEN_WHILE: this.makeRule(null, null, "PREC_NONE"),
    TOKEN_ERROR: this.makeRule(null, null, "PREC_NONE"),
    TOKEN_EOF: this.makeRule(null, null, "PREC_NONE"),
  };

  private current!: Token;
  private previous!: Token;
  private hadError = false;
  private panicMode = false;

  private literal(): Expr {
    switch (this.previous.type) {
      case "TOKEN_FALSE":
        return new LiteralExpr(false);
      case "TOKEN_TRUE":
        return new LiteralExpr(true);
      case "TOKEN_NIL":
        return new LiteralExpr(null);
      default:
        throw new Error("Unreachable"); // TODO: make this prettier
    }
  }

  private binary(): Expr {
    const operatorType: TokenType = this.previous.type;
    const rule = this.getRule(operatorType);
    this.parsePrecedence(rule.precedence + 1);

    switch (operatorType) {
      case "TOKEN_BANG_EQUAL":
        emitBytes(OP_EQUAL, OP_NOT);
        break;
      case "TOKEN_EQUAL_EQUAL":
        emitByte(OP_EQUAL);
        break;
      case "TOKEN_GREATER":
        emitByte(OP_GREATER);
        break;
      case "TOKEN_GREATER_EQUAL":
        emitBytes(OP_LESS, OP_NOT);
        break;
      case "TOKEN_LESS":
        emitByte(OP_LESS);
        break;
      case "TOKEN_LESS_EQUAL":
        emitBytes(OP_GREATER, OP_NOT);
        break;
      case "TOKEN_PLUS":
        emitByte(OP_ADD);
        break;
      case "TOKEN_MINUS":
        emitByte(OP_SUBTRACT);
        break;
      case "TOKEN_STAR":
        emitByte(OP_MULTIPLY);
        break;
      case "TOKEN_SLASH":
        emitByte(OP_DIVIDE);
        break;
      default:
        return;
    }
  }

  private expression(): Expr {
    return this.parsePrecedence("PREC_ASSIGNMENT");
  }

  private grouping(): Expr {
    const expr = this.expression();
    this.consume("TOKEN_RIGHT_PAREN", "Expect ')' after expression.");
    return new GroupingExpr(expr);
  }

  // TODO: maybe join with literal
  private number(): Expr {
    return new LiteralExpr(this.previous.literal); // TODO: check if use previous or current
  }

  // TODO: maybe join with literal
  private string(): Expr {
    return new LiteralExpr(this.previous.literal); // TODO: check if use previous or current
  }

  private unary(): Expr {
    const operatorType: TokenType = this.previous.type;

    // Compile the operand
    this.parsePrecedence("PREC_UNARY");

    switch (operatorType) {
      case "TOKEN_BANG":
        new LogicalExpr();
        break;
      case "TOKEN_MINUS":
        emitByte(OP_NEGATE);
        break;
      default:
        throw new Error();
    }
  }

  private advance(): void {
    this.previous = this.current;

    while (true) {
      this.current = this.scanner.scanToken();
      if (this.current.type != "TOKEN_ERROR") break;

      this.errorAtCurrent(this.current.start);
    }
  }

  private consume(type: TokenType, message: string): void {
    if (this.current.type == type) {
      this.advance();
      return;
    }

    this.errorAtCurrent(message);
  }

  private parsePrecedence(precedence: Precedence): void {
    this.advance();
    const prefixRule = this.getRule(this.previous.type).prefix;
    if (prefixRule == null) {
      this.error("Expect expression.");
      return;
    }

    this.prefixRule();

    while (precedence <= this.getRule(this.current.type).precedence) {
      this.advance();
      const infixRule = this.getRule(this.previous.type).infix;
      infixRule();
    }
  }

  private compile(source: string): boolean {
    this.hadError = false;
    this.panicMode = false;

    this.advance();
    this.expression();
    this.consume("TOKEN_EOF", "Expect end of expression");
    return !this.hadError;
  }

  private getRule(type: TokenType): ParseRule {
    return this.rules[type];
  }

  private makeRule(
    prefix: ParseFn | null,
    infix: ParseFn | null,
    precedence: Precedence
  ): ParseRule {
    return { prefix, infix, precedence };
  }

  private errorAt(token: Token, message: string): void {
    if (this.panicMode) return;
    this.panicMode = true;

    // TODO: get errors
    // fprintf(stderr, "[line %d] Error", token->line);

    // if (token->type == TOKEN_EOF) {
    //   fprintf(stderr, " at end");
    // } else if (token->type == TOKEN_ERROR) {
    //   // Nothing
    // } else {
    //   fprintf(stderr, " at '%.*s'", token->length, token->start);
    // }

    // fprintf(stderr, ": %s\n", message);
    this.hadError = true;
  }

  private errorAtCurrent(message: string): void {
    this.errorAt(this.current, message);
  }

  private error(message: string): void {
    this.errorAt(this.previous, message);
  }
}

export type ParseFn = () => {};

export type ParseRule = {
  prefix: ParseFn | null;
  infix: ParseFn | null;
  precedence: Precedence;
};
