import { join, resolve } from "node:path";
import { createWriteStream } from "node:fs";
import { WriteStream } from "fs";

function defineAst(
  outputDir: string,
  baseName: string,
  types: string[],
  imports: string[]
): void {
  const path = join(outputDir, `${baseName}.ts`);
  const writer = createWriteStream(path, "utf-8");

  for (const importStr of imports) {
    writer.write(importStr);
    writer.write("\n");
  }

  writer.write("\n");
  writer.write(`export abstract class ${baseName} {\n`);
  writer.write(`abstract accept<T>(visitor: ${baseName}Visitor<T>): T;\n`);
  writer.write("}\n");
  writer.write("\n");

  defineVisitor(writer, baseName, types);
  writer.write("\n");

  for (const type of types) {
    const className = type.split(":")[0].trim();
    const fields = type.split(":")[1].trim();
    defineType(writer, baseName, className, fields);
    writer.write("\n");
  }

  writer.end();
}

function defineType(
  writer: WriteStream,
  baseName: string,
  className: string,
  fields: string
) {
  const parameterProperties = fields
    .split(", ")
    .map((field) => `readonly ${field.split(" ")[1]}: ${field.split(" ")[0]}`)
    .join(", ");

  writer.write(`export class ${className}${baseName} extends ${baseName} {\n`);
  writer.write(`  constructor(${parameterProperties}) {\n`);
  writer.write("    super()\n");
  writer.write("  }\n");
  writer.write("\n");
  writer.write(`  accept<T>(visitor: ${baseName}Visitor<T>): T {\n`);
  writer.write(`    return visitor.visit${className}${baseName}(this);\n`);
  writer.write("  }\n");
  writer.write("}\n");
}

function defineVisitor(writer: WriteStream, baseName: string, types: string[]) {
  writer.write(`export interface ${baseName}Visitor<T> {\n`);

  for (const type of types) {
    const className = `${type.split(":")[0].trim()}${baseName}`;
    writer.write(
      `visit${className}(${baseName.toLowerCase()}: ${className}): T;`
    );
    writer.write("\n");
  }

  writer.write("}\n");
}

const outputDir = resolve("./src");

defineAst(
  outputDir,
  "Expr",
  [
    "Assign:   Token name, Expr value",
    "Binary:   Expr left, Token operator, Expr right",
    "Call:     Expr callee, Token paren, Expr[] args",
    "Grouping: Expr expression",
    "Literal:  Literal value",
    "Logical:  Expr left, Token operator, Expr right",
    "Variable: Token name",
    "Unary:    Token operator, Expr right",
  ],
  ['import { Literal, Token } from "./Tokens";']
);

defineAst(
  outputDir,
  "Stmt",
  [
    "Block:      Stmt[] statements",
    "Var :       Token name, Expr|null initializer",
    "Expression: Expr expression",
    "Function:   Token name, Token[] params, Stmt[] body",
    "If:         Expr condition, Stmt thenBranch, Stmt|null elseBranch",
    "Print:      Expr expression",
    "Return:     Token keyword, Expr|null value",
    "While:      Expr condition, Stmt body",
  ],
  ['import { Expr } from "./Expr";', 'import { Token } from "./Tokens";']
);
