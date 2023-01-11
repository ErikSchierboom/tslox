import {
  ExprVisitor,
  Expr,
  BinaryExpr,
  GroupingExpr,
  LiteralExpr,
  UnaryExpr,
  AssignExpr,
  VariableExpr,
  CallExpr,
  GetExpr,
  LogicalExpr,
  SetExpr,
  ThisExpr,
  SuperExpr,
} from "./Expr";

export class AstPrinter implements ExprVisitor<string> {
  print(expr: Expr): string {
    return expr.accept(this);
  }

  visitSuperExpr(expr: SuperExpr): string {
    return this.parenthesize(`super ${expr.method.lexeme}`);
  }

  visitCallExpr(expr: CallExpr): string {
    return this.parenthesize("call", expr.callee, ...expr.args);
  }

  visitGetExpr(expr: GetExpr): string {
    return this.parenthesize(`get ${expr.name.lexeme}`, expr.obj);
  }

  visitLogicalExpr(expr: LogicalExpr): string {
    return this.parenthesize(expr.operator.lexeme, expr.left, expr.right);
  }

  visitSetExpr(expr: SetExpr): string {
    return this.parenthesize(`set ${expr.name.lexeme}`, expr.obj, expr.value);
  }

  visitThisExpr(expr: ThisExpr): string {
    return this.parenthesize("this");
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
    if (expr.value === undefined) return "";
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
