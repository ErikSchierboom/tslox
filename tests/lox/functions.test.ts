import { Runner } from "../../src/lox/Runner";

test("regular function", () => {
  const source = `
    fun adder(x) {
      return x + 2;
    }
    print adder(3);
  `;

  const result = Runner.run(source);

  const expected = ["5"];
  expect(result.output).toEqual(expected);
});

test("recursive function", () => {
  const source = `
    fun faculty(x) {
      if (x == 1) {
        return 1;
      }

      return x * faculty(x - 1);
    }
    print faculty(3);
  `;

  const result = Runner.run(source);

  const expected = ["6"];
  expect(result.output).toEqual(expected);
});
