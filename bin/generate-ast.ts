import { join, resolve } from "node:path";
import { createWriteStream } from "node:fs";
import { WriteStream } from "fs";

function defineAst(outputDir: string, baseName: string, types: string[]): void {
  const path = join(outputDir, "Ast.ts");
  const writer = createWriteStream(path, "utf-8");

  writer.write('import { Token } from "./Tokens"\n');
  writer.write("\n");
  writer.write(`export abstract class ${baseName} {\n`);
  writer.write("abstract accept<T>(visitor: Visitor<T>): T;\n");
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

  writer.write(`export class ${className} extends ${baseName} {\n`);
  writer.write(`  constructor(${parameterProperties}) {\n`);
  writer.write("    super()\n");
  writer.write("  }\n");
  writer.write("\n");
  writer.write("  accept<T>(visitor: Visitor<T>): T {\n");
  writer.write(`    return visitor.visit${className}${baseName}(this);\n`);
  writer.write("  }\n");
  writer.write("}\n");
}

function defineVisitor(writer: WriteStream, baseName: string, types: string[]) {
  writer.write("export interface Visitor<T> {\n");

  for (const type of types) {
    const className = type.split(":")[0].trim();
    writer.write(
      `visit${className}${baseName}(${baseName.toLowerCase()}: ${className}): T;`
    );
    writer.write("\n");
  }

  writer.write("}\n");
}

const outputDir = resolve("./src");

defineAst(outputDir, "Expr", [
  "Binary:   Expr left, Token operator, Expr right",
  "Grouping: Expr expression",
  "Literal:  Object value",
  "Unary:    Token operator, Expr right",
]);
