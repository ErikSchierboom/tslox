import { Lox } from "../src/Lox";

const consoleLogSpy = jest.spyOn(console, "log").mockImplementation();
const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

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

function run(source: string): { logs: string[]; errors: string[] } {
  Lox.run(source);

  return {
    logs: consoleLogSpy.mock.calls.map((args) => args[0]),
    errors: consoleErrorSpy.mock.calls.map((args) => args[0]),
  };
}
