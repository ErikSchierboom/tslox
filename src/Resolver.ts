import {
  AssignExpr,
  BinaryExpr,
  CallExpr,
  Expr,
  ExprVisitor,
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
import { Interpreter } from "./Interpreter";
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
  StmtVisitor,
  VarStmt,
  WhileStmt,
} from "./Stmt";
import { Token } from "./Tokens";

type FunctionType = "NONE" | "FUNCTION" | "INITIALIZER" | "METHOD";
type ClassType = "NONE" | "CLASS" | "SUBCLASS";

export class Resolver implements ExprVisitor<void>, StmtVisitor<void> {
  private readonly scopes: Map<string, boolean>[] = [];
  private currentFunction: FunctionType = "NONE";
  private currentClass: ClassType = "NONE";

  constructor(private readonly interpreter: Interpreter) {}

  visitSuperExpr(expr: SuperExpr): void {
    if (this.currentClass == "NONE") {
      Lox.error(expr.keyword, "Can't use 'super' outside of a class.");
    } else if (this.currentClass != "SUBCLASS") {
      Lox.error(
        expr.keyword,
        "Can't use 'super' in a class with no superclass."
      );
    }

    this.resolveLocal(expr, expr.keyword);
  }

  visitThisExpr(expr: ThisExpr): void {
    if (this.currentClass == "NONE") {
      Lox.error(expr.keyword, "Can't use 'this' outside of a class.");
      return;
    }

    this.resolveLocal(expr, expr.keyword);
  }

  visitSetExpr(expr: SetExpr): void {
    this.resolve(expr.value);
    this.resolve(expr.obj);
  }

  visitGetExpr(expr: GetExpr): void {
    this.resolve(expr.obj);
  }

  visitClassStmt(stmt: ClassStmt): void {
    const enclosingClass = this.currentClass;
    this.currentClass = "CLASS";

    this.declare(stmt.name);
    this.define(stmt.name);

    if (
      stmt.superclass !== null &&
      stmt.name.lexeme === stmt.superclass.name.lexeme
    ) {
      Lox.error(stmt.superclass.name, "A class can't inherit from itself.");
    }

    if (stmt.superclass !== null) {
      this.currentClass = "SUBCLASS";
      this.resolve(stmt.superclass);
    }

    if (stmt.superclass !== null) {
      this.beginScope();
      this.scopes.at(-1)?.set("super", true);
    }

    this.beginScope();
    this.scopes.at(-1)?.set("this", true);

    for (const method of stmt.methods) {
      const declaration: FunctionType =
        method.name.lexeme === "init" ? "INITIALIZER" : "METHOD";
      this.resolveFunction(method, declaration);
    }

    this.endScope();

    if (stmt.superclass !== null) {
      this.endScope();
    }

    this.currentClass = enclosingClass;
  }

  visitAssignExpr(expr: AssignExpr): void {
    this.resolve(expr.value);
    this.resolveLocal(expr, expr.name);
  }
  visitBinaryExpr(expr: BinaryExpr): void {
    this.resolve(expr.left);
    this.resolve(expr.right);
  }
  visitCallExpr(expr: CallExpr): void {
    this.resolve(expr.callee);

    for (const arg of expr.args) {
      this.resolve(arg);
    }
  }
  visitGroupingExpr(expr: GroupingExpr): void {
    this.resolve(expr.expression);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  visitLiteralExpr(expr: LiteralExpr): void {
    return;
  }
  visitLogicalExpr(expr: LogicalExpr): void {
    this.resolve(expr.left);
    this.resolve(expr.right);
  }
  visitVariableExpr(expr: VariableExpr): void {
    if (
      this.scopes.length > 0 &&
      this.scopes.at(-1)?.get(expr.name.lexeme) === false
    ) {
      Lox.error(expr.name, "Can't read local variable in its own initializer.");
    }

    this.resolveLocal(expr, expr.name);
  }
  visitUnaryExpr(expr: UnaryExpr): void {
    this.resolve(expr.right);
  }
  visitBlockStmt(stmt: BlockStmt): void {
    this.beginScope();
    this.resolve(stmt.statements);
    this.endScope();
  }
  visitVarStmt(stmt: VarStmt): void {
    this.declare(stmt.name);
    if (stmt.initializer != null) {
      this.resolve(stmt.initializer);
    }
    this.define(stmt.name);
  }
  visitExpressionStmt(stmt: ExpressionStmt): void {
    this.resolve(stmt.expression);
  }
  visitFunctionStmt(stmt: FunctionStmt): void {
    this.declare(stmt.name);
    this.define(stmt.name);
    this.resolveFunction(stmt, "FUNCTION");
  }
  visitIfStmt(stmt: IfStmt): void {
    this.resolve(stmt.condition);
    this.resolve(stmt.thenBranch);
    if (stmt.elseBranch !== null) {
      this.resolve(stmt.elseBranch);
    }
  }
  visitPrintStmt(stmt: PrintStmt): void {
    this.resolve(stmt.expression);
  }
  visitReturnStmt(stmt: ReturnStmt): void {
    if (this.currentFunction == "NONE") {
      Lox.error(stmt.keyword, "Can't return from top-level code.");
    }

    if (stmt.value !== null) {
      if (this.currentFunction == "INITIALIZER") {
        Lox.error(stmt.keyword, "Can't return from an initializer.");
      }

      this.resolve(stmt.value);
    }
  }
  visitWhileStmt(stmt: WhileStmt): void {
    this.resolve(stmt.condition);
    this.resolve(stmt.body);
  }

  resolve(element: Expr | Stmt | Stmt[]): void {
    if (element instanceof Expr || element instanceof Stmt) {
      element.accept(this);
    } else {
      for (const statement of element) {
        this.resolve(statement);
      }
    }
  }

  private resolveLocal(expr: Expr, name: Token): void {
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      if (this.scopes[i].has(name.lexeme)) {
        this.interpreter.resolve(expr, this.scopes.length - 1 - i);
        return;
      }
    }
  }

  private resolveFunction(func: FunctionStmt, type: FunctionType): void {
    const enclosingFunction = this.currentFunction;
    this.currentFunction = type;

    this.beginScope();
    for (const param of func.params) {
      this.declare(param);
      this.define(param);
    }
    this.resolve(func.body);
    this.endScope();
    this.currentFunction = enclosingFunction;
  }

  private beginScope(): void {
    this.scopes.push(new Map());
  }

  private endScope(): void {
    this.scopes.pop();
  }

  private declare(name: Token): void {
    if (this.scopes.length === 0) return;

    const scope = this.scopes.at(-1);
    if (scope?.has(name.lexeme)) {
      Lox.error(name, "Already a variable with this name in this scope.");
    }

    scope?.set(name.lexeme, false);
  }

  private define(name: Token): void {
    if (this.scopes.length === 0) return;

    const scope = this.scopes.at(-1);
    scope?.set(name.lexeme, true);
  }
}
