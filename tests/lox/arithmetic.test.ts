import { Runner } from "../../src/lox/Runner";

test("arithmetic", () => {
  const source = `
    print 1 + 2;
    print 8 - 4;
    print 3 * 2;
    print 15 / 3;
  `;

  const result = Runner.run(source);

  const expected = ["3", "4", "6", "5"];
  expect(result.output).toEqual(expected);
});

test("arithmetic precedence", () => {
  const source = `
    print 2 - 1 + 3;
    print 8 + 4 * 3;
    print 3 * 4 / 2;
    print 2 - (1 + 3);
  `;

  const result = Runner.run(source);

  const expected = ["4", "20", "6", "-2"];
  expect(result.output).toEqual(expected);
});
