import { Token } from "./Tokens";

export abstract class Expr {
  abstract accept<T>(visitor: Visitor<T>): T;
}

export interface Visitor<T> {
  visitBinaryExpr(expr: Binary): T;
  visitGroupingExpr(expr: Grouping): T;
  visitLiteralExpr(expr: Literal): T;
  visitUnaryExpr(expr: Unary): T;
}

export class Binary extends Expr {
  constructor(
    readonly left: Expr,
    readonly operator: Token,
    readonly right: Expr
  ) {
    super();
  }

  accept<T>(visitor: Visitor<T>): T {
    return visitor.visitBinaryExpr(this);
  }
}

export class Grouping extends Expr {
  constructor(readonly expression: Expr) {
    super();
  }

  accept<T>(visitor: Visitor<T>): T {
    return visitor.visitGroupingExpr(this);
  }
}

export class Literal extends Expr {
  constructor(readonly value: Object) {
    super();
  }

  accept<T>(visitor: Visitor<T>): T {
    return visitor.visitLiteralExpr(this);
  }
}

export class Unary extends Expr {
  constructor(readonly operator: Token, readonly right: Expr) {
    super();
  }

  accept<T>(visitor: Visitor<T>): T {
    return visitor.visitUnaryExpr(this);
  }
}
