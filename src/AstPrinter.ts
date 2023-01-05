import {
  ExprVisitor,
  Expr,
  BinaryExpr,
  GroupingExpr,
  LiteralExpr,
  UnaryExpr,
  AssignExpr,
  VariableExpr,
} from "./Expr";

export class AstPrinter implements ExprVisitor<string> {
  print(expr: Expr): string {
    return expr.accept(this);
  }

  visitAssignExpr(expr: AssignExpr): string {
    return this.parenthesize(`${expr.name.lexeme} =`, expr.value);
  }

  visitVariableExpr(expr: VariableExpr): string {
    return this.parenthesize(`var ${expr.name.lexeme}`);
  }

  visitBinaryExpr(expr: BinaryExpr): string {
    return this.parenthesize(expr.operator.lexeme, expr.left, expr.right);
  }

  visitGroupingExpr(expr: GroupingExpr): string {
    return this.parenthesize("group", expr.expression);
  }

  visitLiteralExpr(expr: LiteralExpr): string {
    if (expr.value === null) return "nil";
    return expr.value.toString();
  }

  visitUnaryExpr(expr: UnaryExpr): string {
    return this.parenthesize(expr.operator.lexeme, expr.right);
  }

  parenthesize(name: string, ...exprs: Expr[]): string {
    let builder = "";
    builder += "(";
    builder += name;

    for (const expr of exprs) {
      builder += " ";
      builder += expr.accept(this);
    }

    builder += ")";

    return builder;
  }
}
