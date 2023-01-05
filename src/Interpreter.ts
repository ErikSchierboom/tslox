import exp from "constants";
import {
  BinaryExpr,
  Expr,
  GroupingExpr,
  LiteralExpr,
  UnaryExpr,
  Visitor,
} from "./Ast";
import { Lox } from "./Lox";
import { RuntimeError } from "./RuntimeError";
import { Token } from "./Tokens";

export class Interpreter implements Visitor<any> {
  interpret(expr: Expr): void {
    try {
      const value = this.evaluate(expr);
      console.log(this.stringify(value));
    } catch (error) {
      if (error instanceof RuntimeError) {
        Lox.runtimeError(error);
      } else {
        throw error;
      }
    }
  }

  stringify(value: any): any {
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

  isEqual(a: any, b: any) {
    // TODO: see if this can be simplified
    if (a === null && b === null) return true;
    if (a === null) return false;

    return a === b;
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

  checkNumberOperands(operator: Token, left: any, right: any) {
    if (typeof left === "number" && typeof right === "number") return;
    throw new RuntimeError(operator, "Operands must be numbers");
  }

  checkNumberOperand(operator: Token, operand: any) {
    if (typeof operand === "number") return;

    throw new RuntimeError(operator, "Operand must be a number");
  }

  evaluate(expr: Expr): any {
    return expr.accept(this);
  }

  isTruthy(value: any) {
    if (value === null) return false;
    if (value === false) return false;
    return true;
  }
}
