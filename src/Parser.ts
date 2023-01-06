import {
  AssignExpr,
  BinaryExpr,
  CallExpr,
  Expr,
  GetExpr,
  GroupingExpr,
  LiteralExpr,
  LogicalExpr,
  SetExpr,
  SuperExpr,
  ThisExpr,
  UnaryExpr,
  VariableExpr,
} from "./Expr";
import { Lox } from "./Lox";
import {
  BlockStmt,
  ClassStmt,
  ExpressionStmt,
  FunctionStmt,
  IfStmt,
  PrintStmt,
  ReturnStmt,
  Stmt,
  VarStmt,
  WhileStmt,
} from "./Stmt";
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
      if (this.match("CLASS")) return this.classDeclaration();
      if (this.match("FUN")) return this.function("function");
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

  private classDeclaration(): Stmt {
    const name = this.consume("IDENTIFIER", "Expect class name");

    let superclass: VariableExpr | null = null;
    if (this.match("LESS")) {
      this.consume("IDENTIFIER", "Expect superclass name");
      superclass = new VariableExpr(this.previous());
    }

    this.consume("LEFT_BRACE", "Expect '{' before class body.");
    const methods: FunctionStmt[] = [];

    while (!this.check("RIGHT_BRACE") && !this.isAtEnd()) {
      methods.push(this.function("method"));
    }

    this.consume("RIGHT_BRACE", "Expect '}' after class body.");
    return new ClassStmt(name, superclass, methods);
  }

  private function(kind: string): FunctionStmt {
    const name = this.consume("IDENTIFIER", `Expect ${kind} name.`);
    this.consume("LEFT_PAREN", `Expect '(' after ${kind} name.`);
    const parameters: Token[] = [];
    if (!this.check("RIGHT_PAREN")) {
      do {
        if (parameters.length >= 255) {
          this.error(this.peek(), "Can't have more than 255 parameters");
        }
        parameters.push(this.consume("IDENTIFIER", "Expect parameter name"));
      } while (this.match("COMMA"));
    }
    this.consume("RIGHT_PAREN", "Expect ')' after parameters");
    this.consume("LEFT_BRACE", `Expect '{' before ${kind} body.`);
    const body = this.block();
    return new FunctionStmt(name, parameters, body);
  }

  private varDeclaration(): Stmt {
    const name = this.consume("IDENTIFIER", "Expect variable name.");
    const initializer = this.match("EQUAL") ? this.expression() : null;

    this.consume("SEMICOLON", "Expect ';' after variable declaration.");
    return new VarStmt(name, initializer);
  }

  private statement(): Stmt {
    if (this.match("FOR")) return this.forStatement();
    if (this.match("IF")) return this.ifStatement();
    if (this.match("PRINT")) return this.printStatement();
    if (this.match("RETURN")) return this.returnStatement();
    if (this.match("WHILE")) return this.whileStatement();
    if (this.match("LEFT_BRACE")) return new BlockStmt(this.block());

    return this.expressionStatement();
  }

  private returnStatement(): Stmt {
    const keyword = this.previous();
    const value = this.check("SEMICOLON") ? null : this.expression();
    this.consume("SEMICOLON", "Expect ';' after return value.");
    return new ReturnStmt(keyword, value);
  }

  private forStatement(): Stmt {
    this.consume("LEFT_PAREN", "Expect '(' after 'for'.");

    let initializer: Stmt | null;
    if (this.match("SEMICOLON")) {
      initializer = null;
    } else if (this.match("VAR")) {
      initializer = this.varDeclaration();
    } else {
      initializer = this.expressionStatement();
    }

    let condition: Expr | null = null;
    if (!this.check("SEMICOLON")) {
      condition = this.expression();
    }
    this.consume("SEMICOLON", "Expect ';' after 'for' loop condition.");

    let increment: Expr | null = null;
    if (!this.check("RIGHT_PAREN")) {
      increment = this.expression();
    }
    this.consume("RIGHT_PAREN", "Expect ')' after 'for' clauses.");

    let body = this.statement();

    if (increment != null) {
      body = new BlockStmt([body, new ExpressionStmt(increment)]);
    }

    if (condition == null) condition = new LiteralExpr(true);
    body = new WhileStmt(condition, body);

    if (initializer != null) {
      body = new BlockStmt([initializer, body]);
    }

    return body;
  }

  private whileStatement(): Stmt {
    this.consume("LEFT_BRACE", "Expect '(' after while.");
    const condition = this.expression();
    this.consume("RIGHT_BRACE", "Expect ')' after while condition.");

    const body = this.statement();
    return new WhileStmt(condition, body);
  }

  private ifStatement(): Stmt {
    this.consume("LEFT_PAREN", "Expect '(' after 'if'.");
    const condition = this.expression();
    this.consume("RIGHT_PAREN", "Expect ')' after if condition.");

    const thenBranch = this.statement();
    const elseBranch = this.match("ELSE") ? this.statement() : null;

    return new IfStmt(condition, thenBranch, elseBranch);
  }

  private block(): Stmt[] {
    const statements: Stmt[] = [];

    while (!this.check("RIGHT_BRACE") && !this.isAtEnd()) {
      const stmt = this.declaration();
      if (stmt !== null) {
        statements.push(stmt);
      }
    }

    this.consume("RIGHT_BRACE", "Expect '}' after block.");
    return statements;
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
    const expr = this.or();

    if (this.match("EQUAL")) {
      const equals = this.previous();
      const value = this.assignment();

      if (expr instanceof VariableExpr) {
        const name = expr.name;
        return new AssignExpr(name, value);
      } else if (expr instanceof GetExpr) {
        return new SetExpr(expr.obj, expr.name, value);
      }

      this.error(equals, "Invalid assignment target.");
    }

    return expr;
  }

  private or(): Expr {
    let expr = this.and();

    while (this.match("OR")) {
      const operator = this.previous();
      const right = this.and();
      expr = new LogicalExpr(expr, operator, right);
    }

    return expr;
  }

  private and(): Expr {
    let expr = this.equality();

    while (this.match("AND")) {
      const operator = this.previous();
      const right = this.equality();
      expr = new LogicalExpr(expr, operator, right);
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

    return this.call();
  }

  private call(): Expr {
    let expr = this.primary();

    while (true) {
      if (this.match("LEFT_PAREN")) {
        expr = this.finishCall(expr);
      } else if (this.match("DOT")) {
        const name = this.consume(
          "IDENTIFIER",
          "Expect property name after '.'."
        );
        expr = new GetExpr(expr, name);
      } else {
        break;
      }
    }

    return expr;
  }

  private finishCall(callee: Expr): Expr {
    const args: Expr[] = [];

    if (!this.check("RIGHT_PAREN")) {
      do {
        if (args.length >= 255) {
          this.error(this.peek(), "Can't have more than 255 arguments.");
        }
        args.push(this.expression());
      } while (this.match("COMMA"));
    }

    const paren = this.consume("RIGHT_PAREN", "Expect ')' after arguments.");
    return new CallExpr(callee, paren, args);
  }

  private primary(): Expr {
    if (this.match("FALSE")) return new LiteralExpr(false);
    if (this.match("TRUE")) return new LiteralExpr(true);
    if (this.match("NIL")) return new LiteralExpr(null);

    if (this.match("NUMBER", "STRING")) {
      return new LiteralExpr(this.previous().literal);
    }

    if (this.match("SUPER")) {
      const keyword = this.previous();
      this.consume("DOT", "Expect '.' after 'super'.");
      const method = this.consume(
        "IDENTIFIER",
        "Expect superclass method name"
      );
      return new SuperExpr(keyword, method);
    }

    if (this.match("THIS")) return new ThisExpr(this.previous());

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
