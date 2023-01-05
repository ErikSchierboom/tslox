import { Expr } from "./Expr";
import { Token } from "./Tokens";

export abstract class Stmt {
  abstract accept<T>(visitor: StmtVisitor<T>): T;
}

export interface StmtVisitor<T> {
  visitBlockStmt(stmt: BlockStmt): T;
  visitVarStmt(stmt: VarStmt): T;
  visitExpressionStmt(stmt: ExpressionStmt): T;
  visitIfStmt(stmt: IfStmt): T;
  visitPrintStmt(stmt: PrintStmt): T;
  visitWhileStmt(stmt: WhileStmt): T;
}

export class BlockStmt extends Stmt {
  constructor(readonly statements: Stmt[]) {
    super();
  }

  accept<T>(visitor: StmtVisitor<T>): T {
    return visitor.visitBlockStmt(this);
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

export class ExpressionStmt extends Stmt {
  constructor(readonly expression: Expr) {
    super();
  }

  accept<T>(visitor: StmtVisitor<T>): T {
    return visitor.visitExpressionStmt(this);
  }
}

export class IfStmt extends Stmt {
  constructor(
    readonly condition: Expr,
    readonly thenBranch: Stmt,
    readonly elseBranch: Stmt | null
  ) {
    super();
  }

  accept<T>(visitor: StmtVisitor<T>): T {
    return visitor.visitIfStmt(this);
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

export class WhileStmt extends Stmt {
  constructor(readonly condition: Expr, readonly body: Stmt) {
    super();
  }

  accept<T>(visitor: StmtVisitor<T>): T {
    return visitor.visitWhileStmt(this);
  }
}
