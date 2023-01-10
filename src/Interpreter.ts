import { Environment } from "./Environment";
import {
  BinaryExpr,
  Expr,
  GroupingExpr,
  LiteralExpr,
  UnaryExpr,
  ExprVisitor,
  VariableExpr,
  AssignExpr,
  LogicalExpr,
  CallExpr,
  GetExpr,
  SetExpr,
  ThisExpr,
  SuperExpr,
} from "./Expr";
import { Lox } from "./Lox";
import { LoxBuiltin } from "./LoxBuiltin";
import { isLoxCallable } from "./LoxCallable";
import { LoxClass } from "./LoxClass";
import { LoxFunction } from "./LoxFunction";
import { LoxInstance } from "./LoxInstance";
import { Return } from "./Return";
import { RuntimeError } from "./RuntimeError";
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

export class Interpreter implements ExprVisitor<any>, StmtVisitor<void> {
  public globals = new Environment();
  private environment: Environment = this.globals;
  private readonly locals: Map<Expr, number> = new Map();

  constructor() {
    this.globals.define("clock", new LoxBuiltin(0, () => Date.now() / 1000));
  }

  interpret(statements: Stmt[]): void {
    try {
      for (const statement of statements) {
        this.execute(statement);
      }
    } catch (error) {
      if (error instanceof RuntimeError) {
        Lox.runtimeError(error);
      } else {
        throw error;
      }
    }
  }

  resolve(expr: Expr, depth: number): void {
    this.locals.set(expr, depth);
  }

  private execute(stmt: Stmt) {
    stmt.accept(this);
  }

  private evaluate(expr: Expr): any {
    return expr.accept(this);
  }

  visitSuperExpr(expr: SuperExpr) {
    const distance = this.locals.get(expr)!;
    const superclass = this.environment.getAt(distance, "super") as LoxClass;
    const instance = this.environment.getAt(
      distance - 1,
      "this"
    ) as LoxInstance;
    const method = superclass.findMethod(expr.method.lexeme);

    if (method === undefined) {
      throw new RuntimeError(
        expr.method,
        `Undefined property '${expr.method.lexeme}'.`
      );
    }

    return method.bind(instance);
  }

  visitThisExpr(expr: ThisExpr) {
    return this.lookupVariable(expr.keyword, expr);
  }

  visitSetExpr(expr: SetExpr): any {
    const obj = this.evaluate(expr.obj);

    if (!(obj instanceof LoxInstance)) {
      throw new RuntimeError(expr.name, "Only instances have fields.");
    }

    const value = this.evaluate(expr.value);
    obj.set(expr.name, value);
    return value;
  }

  visitGetExpr(expr: GetExpr): any {
    const obj = this.evaluate(expr.obj);
    if (obj instanceof LoxInstance) {
      return obj.get(expr.name);
    }

    throw new RuntimeError(expr.name, "Only instances have properties");
  }

  visitClassStmt(stmt: ClassStmt): void {
    let superclass: LoxClass | null = null;
    if (stmt.superclass != null) {
      superclass = this.evaluate(stmt.superclass);
      if (!(superclass instanceof LoxClass)) {
        throw new RuntimeError(
          stmt.superclass.name,
          "Superclass must be a class."
        );
      }
    }

    this.environment.define(stmt.name.lexeme, null);

    if (superclass != null) {
      this.environment = new Environment(this.environment);
      this.environment.define("super", superclass);
    }

    const methods: Map<string, LoxFunction> = new Map();
    for (const method of stmt.methods) {
      const func = new LoxFunction(
        method,
        this.environment,
        method.name.lexeme === "init"
      );
      methods.set(method.name.lexeme, func);
    }

    const klass = new LoxClass(stmt.name.lexeme, superclass, methods);

    if (superclass != null) {
      this.environment = this.environment.enclosing!;
    }

    this.environment.assign(stmt.name, klass);
  }

  visitReturnStmt(stmt: ReturnStmt): void {
    const value = stmt.value === null ? null : this.evaluate(stmt.value);
    throw new Return(value);
  }

  visitFunctionStmt(stmt: FunctionStmt): void {
    const func = new LoxFunction(stmt, this.environment, false);
    this.environment.define(stmt.name.lexeme, func);
  }

  visitCallExpr(expr: CallExpr) {
    const callee = this.evaluate(expr.callee);
    const args = expr.args.map((arg) => this.evaluate(arg));

    if (!isLoxCallable(callee)) {
      throw new RuntimeError(
        expr.paren,
        "Can only call functions and classes."
      );
    }

    if (args.length !== callee.arity()) {
      throw new RuntimeError(
        expr.paren,
        `Expected ${callee.arity()} arguments but got ${args.length}.`
      );
    }

    return callee.call(this, args);
  }

  visitWhileStmt(stmt: WhileStmt): void {
    while (this.isTruthy(this.evaluate(stmt.condition))) {
      this.execute(stmt.body);
    }
  }

  visitIfStmt(stmt: IfStmt): void {
    if (this.isTruthy(this.evaluate(stmt.condition))) {
      this.execute(stmt.thenBranch);
    } else if (stmt.elseBranch != null) {
      this.execute(stmt.elseBranch);
    }
  }

  visitBlockStmt(stmt: BlockStmt): void {
    this.executeBlock(stmt.statements, new Environment(this.environment));
  }

  visitVarStmt(stmt: VarStmt): void {
    const value =
      stmt.initializer === null ? null : this.evaluate(stmt.initializer);

    this.environment.define(stmt.name.lexeme, value);
  }

  visitExpressionStmt(stmt: ExpressionStmt): void {
    this.evaluate(stmt.expression);
  }

  visitPrintStmt(stmt: PrintStmt): void {
    const value = this.evaluate(stmt.expression);
    console.log(this.stringify(value));
  }

  visitAssignExpr(expr: AssignExpr): any {
    const value = this.evaluate(expr.value);
    const distance = this.locals.get(expr);
    if (distance !== undefined) {
      this.environment.assignAt(distance, expr.name, value);
    } else {
      this.globals.assign(expr.name, value);
    }

    return value;
  }

  visitVariableExpr(expr: VariableExpr): any {
    return this.lookupVariable(expr.name, expr);
  }

  visitLogicalExpr(expr: LogicalExpr) {
    const left = this.evaluate(expr.left);

    if (expr.operator.type == "OR") {
      if (this.isTruthy(left)) {
        return left;
      }
    } else {
      if (!this.isTruthy(left)) {
        return left;
      }
    }

    return this.evaluate(expr.right);
  }

  visitBinaryExpr(expr: BinaryExpr): any {
    const left = this.evaluate(expr.left);
    const right = this.evaluate(expr.right);

    switch (expr.operator.type) {
      case "GREATER":
        this.checkNumberOperands(expr.operator, left, right);
        return left > right;
      case "GREATER_EQUAL":
        this.checkNumberOperands(expr.operator, left, right);
        return left >= right;
      case "LESS":
        this.checkNumberOperands(expr.operator, left, right);
        return left < right;
      case "LESS_EQUAL":
        this.checkNumberOperands(expr.operator, left, right);
        return left <= right;
      case "BANG_EQUAL":
        return !this.isEqual(left, right);
      case "EQUAL_EQUAL":
        return this.isEqual(left, right);
      case "MINUS":
        this.checkNumberOperands(expr.operator, left, right);
        return left - right;
      case "SLASH":
        this.checkNumberOperands(expr.operator, left, right);
        return left / right;
      case "STAR":
        this.checkNumberOperands(expr.operator, left, right);
        return left * right;
      case "PLUS":
        if (typeof left === "number" && typeof right === "number")
          return left + right;

        if (typeof left === "string" && typeof right === "string")
          return left + right;

        throw new RuntimeError(
          expr.operator,
          "Operands must be two numbers of two strings."
        );
    }

    return null;
  }

  visitGroupingExpr(expr: GroupingExpr): any {
    return this.evaluate(expr.expression);
  }

  visitLiteralExpr(expr: LiteralExpr): any {
    return expr.value;
  }

  visitUnaryExpr(expr: UnaryExpr): any {
    const right = this.evaluate(expr.right);

    switch (expr.operator.type) {
      case "BANG":
        return !this.isTruthy(right);
      case "MINUS":
        this.checkNumberOperand(expr.operator, right);
        return -right;
    }

    return null;
  }

  executeBlock(statements: Stmt[], environment: Environment): void {
    const previous = this.environment;

    try {
      this.environment = environment;

      for (const statement of statements) {
        this.execute(statement);
      }
    } finally {
      this.environment = previous;
    }
  }

  private checkNumberOperands(operator: Token, left: any, right: any) {
    if (typeof left === "number" && typeof right === "number") return;
    throw new RuntimeError(operator, "Operands must be numbers");
  }

  private checkNumberOperand(operator: Token, operand: any) {
    if (typeof operand === "number") return;

    throw new RuntimeError(operator, "Operand must be a number");
  }

  private isEqual(a: any, b: any) {
    // TODO: see if this can be simplified
    if (a === null && b === null) return true;
    if (a === null) return false;

    return a === b;
  }

  private isTruthy(value: any) {
    if (value === null) return false;
    if (value === false) return false;
    return true;
  }

  private stringify(value: any): any {
    if (value === null) return "nil";

    if (typeof value === "number") {
      let text = value.toString();
      if (text.endsWith(".0")) {
        text = text.substring(0, text.length - 2);
      }
      return text;
    }

    return value.toString();
  }

  private lookupVariable(name: Token, expr: Expr): any {
    const distance = this.locals.get(expr);
    if (distance !== undefined) {
      return this.environment.getAt(distance, name.lexeme);
    } else {
      return this.globals.get(name);
    }
  }
}
