import { Expr } from "./Expr";

export abstract class Stmt {
  abstract accept<T>(visitor: Visitor<T>): T;
}

export interface Visitor<T> {
  visitExpressionStmt(stmt: ExpressionStmt): T;
  visitPrintStmt(stmt: PrintStmt): T;
}

export class ExpressionStmt extends Stmt {
  constructor(readonly expression: Expr) {
    super();
  }

  accept<T>(visitor: Visitor<T>): T {
    return visitor.visitExpressionStmt(this);
  }
}

export class PrintStmt extends Stmt {
  constructor(readonly expression: Expr) {
    super();
  }

  accept<T>(visitor: Visitor<T>): T {
    return visitor.visitPrintStmt(this);
  }
}
