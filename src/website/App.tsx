import React, { FormEvent, useState } from "react";
import { AstPrinter } from "../lox/AstPrinter";
import { Interpreter } from "../lox/Interpreter";
import { Runner } from "../lox/Runner";
import { Parser } from "../lox/Parser";
import { Resolver } from "../lox/Resolver";
import { Scanner } from "../lox/Scanner";

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

    if (Runner.hadError) return;

    const resolver = new Resolver(interpreter);
    resolver.resolve(statements);

    if (Runner.hadError) return;

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
