import { Runner } from "../../src/lox/Runner";

test("tokenizer error", () => {
  const source = "print 1 + @;";

  const result = Runner.run(source);

  const expected = ["[line 1] Unexpected character '@'."];
  expect(result.parseErrors.map((error) => error.message)).toEqual(expected);
});

test("parser error", () => {
  const source = "print 1 + 2";

  const result = Runner.run(source);

  const expected = ["[line 1] Error at end: Expect ';' after value."];
  expect(result.parseErrors.map((error) => error.message)).toEqual(expected);
});

test("resolver error", () => {
  const source = "return 1;";

  const result = Runner.run(source);

  const expected = [
    "[line 1] Error at 'return': Can't return from top-level code.",
  ];
  expect(result.parseErrors.map((error) => error.message)).toEqual(expected);
});
