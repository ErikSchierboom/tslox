import {
  AssignExpr,
  BinaryExpr,
  Expr,
  GroupingExpr,
  LiteralExpr,
  UnaryExpr,
  VariableExpr,
} from "./Expr";
import { Lox } from "./Lox";
import { ExpressionStmt, PrintStmt, Stmt, VarStmt } from "./Stmt";
import { Token, TokenType } from "./Tokens";

export class ParseError extends Error {}

export class Parser {
  private current: number = 0;

  constructor(private readonly tokens: Token[]) {}

  parse(): (Stmt | null)[] {
    const statements = [];

    while (!this.isAtEnd()) {
      statements.push(this.declaration());
    }

    return statements;
  }

  private declaration(): Stmt | null {
    try {
      if (this.match("VAR")) return this.varDeclaration();
      return this.statement();
    } catch (error) {
      if (error instanceof ParseError) {
        this.synchronize();
        return null;
      }

      throw error;
    }
  }

  private varDeclaration(): Stmt {
    const name = this.consume("IDENTIFIER", "Expect variable name.");
    const initializer = this.match("EQUAL") ? this.expression() : null;

    this.consume("SEMICOLON", "Expect ';' after variable declaration.");
    return new VarStmt(name, initializer);
  }

  private statement(): Stmt {
    if (this.match("PRINT")) return this.printStatement();

    return this.expressionStatement();
  }

  private printStatement(): Stmt {
    const value = this.expression();
    this.consume("SEMICOLON", "Expect ';' after value.");
    return new PrintStmt(value);
  }

  private expressionStatement(): Stmt {
    const expr = this.expression();
    this.consume("SEMICOLON", "Expect ';' after expression.");
    return new ExpressionStmt(expr);
  }

  private expression(): Expr {
    return this.assignment();
  }

  private assignment(): Expr {
    const expr = this.equality();

    if (this.match("EQUAL")) {
      const equals = this.previous();
      const value = this.assignment();

      if (expr instanceof VariableExpr) {
        const name = expr.name;
        return new AssignExpr(name, value);
      }

      this.error(equals, "Invalid assignment target.");
    }

    return expr;
  }

  private equality(): Expr {
    let expr = this.comparison();

    while (this.match("BANG_EQUAL", "EQUAL_EQUAL")) {
      const operator = this.previous();
      const right = this.comparison();
      expr = new BinaryExpr(expr, operator, right);
    }

    return expr;
  }

  private comparison(): Expr {
    let expr = this.term();

    while (this.match("GREATER", "GREATER_EQUAL", "LESS", "LESS_EQUAL")) {
      const operator = this.previous();
      const right = this.term();
      expr = new BinaryExpr(expr, operator, right);
    }

    return expr;
  }

  private term(): Expr {
    let expr = this.factor();

    while (this.match("MINUS", "PLUS")) {
      const operator = this.previous();
      const right = this.factor();
      expr = new BinaryExpr(expr, operator, right);
    }

    return expr;
  }

  private factor(): Expr {
    let expr = this.unary();

    while (this.match("SLASH", "STAR")) {
      const operator = this.previous();
      const right = this.unary();
      expr = new BinaryExpr(expr, operator, right);
    }

    return expr;
  }

  private unary(): Expr {
    if (this.match("BANG", "MINUS")) {
      const operator = this.previous();
      const right = this.unary();
      return new UnaryExpr(operator, right);
    }

    return this.primary();
  }

  private primary(): Expr {
    if (this.match("FALSE")) return new LiteralExpr(false);
    if (this.match("TRUE")) return new LiteralExpr(true);
    if (this.match("NIL")) return new LiteralExpr(null);

    if (this.match("NUMBER", "STRING")) {
      return new LiteralExpr(this.previous().literal);
    }

    if (this.match("IDENTIFIER")) {
      return new VariableExpr(this.previous());
    }

    if (this.match("LEFT_PAREN")) {
      const expr = this.expression();
      this.consume("RIGHT_PAREN", "Expect ')' after expression.");
      return new GroupingExpr(expr);
    }

    throw this.error(this.peek(), "Expect expression.");
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();

    throw this.error(this.peek(), message);
  }

  private error(token: Token, message: string): ParseError {
    Lox.error(token, message);
    return new ParseError();
  }

  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }

    return false;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type == type;
  }

  private isAtEnd(): boolean {
    return this.peek().type == "EOF";
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private synchronize(): void {
    this.advance();
    while (!this.isAtEnd()) {
      if (this.previous().type == "SEMICOLON") return;

      switch (this.peek().type) {
        case "CLASS":
        case "FOR":
        case "FUN":
        case "IF":
        case "PRINT":
        case "RETURN":
        case "VAR":
        case "WHILE":
          return;
      }

      this.advance();
    }
  }
}
