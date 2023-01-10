import { Lox } from "../src/Lox";

beforeEach(() => jest.clearAllMocks());
afterEach(() => jest.restoreAllMocks());

test("arithmetic", () => {
  const source = `
    print 1 + 2;
    print 8 - 4;
    print 3 * 2;
    print 15 / 3;
  `;

  const { logs: logs } = run(source);

  const expected = ["3", "4", "6", "5"];
  expect(logs).toEqual(expected);
});

test("arithmetic precedence", () => {
  const source = `
    print 2 - 1 + 3;
    print 8 + 4 * 3;
    print 3 * 4 / 2;
    print 2 - (1 + 3);
  `;

  const { logs: logs } = run(source);

  const expected = ["4", "20", "6", "-2"];
  expect(logs).toEqual(expected);
});

function run(source: string): { logs: string[]; errors: string[] } {
  const consoleLogSpy = jest.spyOn(console, "log").mockImplementation();
  const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

  Lox.run(source);

  return {
    logs: consoleLogSpy.mock.calls.map((args) => args[0]),
    errors: consoleErrorSpy.mock.calls.map((args) => args[0]),
  };
}
