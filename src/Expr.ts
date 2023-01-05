import { Literal, Token } from "./Tokens";

export abstract class Expr {
  abstract accept<T>(visitor: ExprVisitor<T>): T;
}

export interface ExprVisitor<T> {
  visitAssignExpr(expr: AssignExpr): T;
  visitBinaryExpr(expr: BinaryExpr): T;
  visitGroupingExpr(expr: GroupingExpr): T;
  visitLiteralExpr(expr: LiteralExpr): T;
  visitVariableExpr(expr: VariableExpr): T;
  visitUnaryExpr(expr: UnaryExpr): T;
}

export class AssignExpr extends Expr {
  constructor(readonly name: Token, readonly value: Expr) {
    super();
  }

  accept<T>(visitor: ExprVisitor<T>): T {
    return visitor.visitAssignExpr(this);
  }
}

export class BinaryExpr extends Expr {
  constructor(
    readonly left: Expr,
    readonly operator: Token,
    readonly right: Expr
  ) {
    super();
  }

  accept<T>(visitor: ExprVisitor<T>): T {
    return visitor.visitBinaryExpr(this);
  }
}

export class GroupingExpr extends Expr {
  constructor(readonly expression: Expr) {
    super();
  }

  accept<T>(visitor: ExprVisitor<T>): T {
    return visitor.visitGroupingExpr(this);
  }
}

export class LiteralExpr extends Expr {
  constructor(readonly value: Literal) {
    super();
  }

  accept<T>(visitor: ExprVisitor<T>): T {
    return visitor.visitLiteralExpr(this);
  }
}

export class VariableExpr extends Expr {
  constructor(readonly name: Token) {
    super();
  }

  accept<T>(visitor: ExprVisitor<T>): T {
    return visitor.visitVariableExpr(this);
  }
}

export class UnaryExpr extends Expr {
  constructor(readonly operator: Token, readonly right: Expr) {
    super();
  }

  accept<T>(visitor: ExprVisitor<T>): T {
    return visitor.visitUnaryExpr(this);
  }
}
