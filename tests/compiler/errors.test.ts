import { run } from "./runner";

test("syntax errors", () => {
  const source = "print 1 + 2";

  const result = run(source);

  const expected = ["[line 1] Error at end Expect ';' after value."];
  expect(result.errors).toEqual(expected);
});
