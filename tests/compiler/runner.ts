import { Lox } from "../../src/compiler/Lox";

export function run(source: string): { logs: string[]; errors: string[] } {
  const consoleLogSpy = jest.spyOn(console, "log").mockImplementation();
  const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

  Lox.run(source);

  const result = {
    logs: consoleLogSpy.mock.calls.map((args) => args[0]),
    errors: consoleErrorSpy.mock.calls.map((args) => args[0]),
  };

  consoleLogSpy.mockRestore();
  consoleErrorSpy.mockRestore();

  return result;
}
