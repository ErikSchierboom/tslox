import React, { FormEvent, useState } from "react";
import { AstPrinter } from "../compiler/AstPrinter";
import { Interpreter } from "../compiler/Interpreter";
import { Lox } from "../compiler/Lox";
import { Parser } from "../compiler/Parser";
import { Resolver } from "../compiler/Resolver";
import { Scanner } from "../compiler/Scanner";

export function App() {
  const interpreter = new Interpreter();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  const handleChange = function (event: FormEvent<HTMLTextAreaElement>) {
    const source = event.currentTarget.value;

    const interpreter = new Interpreter();

    const scanner = new Scanner(source);
    const tokens = scanner.scanTokens();

    const parser = new Parser(tokens);
    const statements = parser.parse();

    if (Lox.hadError) return;

    const resolver = new Resolver(interpreter);
    resolver.resolve(statements);

    if (Lox.hadError) return;

    interpreter.interpret(statements);
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <label>
          Source code:
          <textarea onChange={handleChange} />
        </label>
        <input type="submit" value="Submit" />
      </form>
    </div>
  );
}
