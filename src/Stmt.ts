import { Expr } from "./Expr";
import { Token } from "./Tokens";

export abstract class Stmt {
  abstract accept<T>(visitor: StmtVisitor<T>): T;
}

export interface StmtVisitor<T> {
  visitExpressionStmt(stmt: ExpressionStmt): T;
  visitVarStmt(stmt: VarStmt): T;
  visitPrintStmt(stmt: PrintStmt): T;
}

export class ExpressionStmt extends Stmt {
  constructor(readonly expression: Expr) {
    super();
  }

  accept<T>(visitor: StmtVisitor<T>): T {
    return visitor.visitExpressionStmt(this);
  }
}

export class VarStmt extends Stmt {
  constructor(readonly name: Token, readonly initializer: Expr | null) {
    super();
  }

  accept<T>(visitor: StmtVisitor<T>): T {
    return visitor.visitVarStmt(this);
  }
}

export class PrintStmt extends Stmt {
  constructor(readonly expression: Expr) {
    super();
  }

  accept<T>(visitor: StmtVisitor<T>): T {
    return visitor.visitPrintStmt(this);
  }
}
