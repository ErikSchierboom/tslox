import { Runner } from "../../src/lox/Runner";

export function run(source: string): { logs: string[]; errors: string[] } {
  const consoleLogSpy = jest.spyOn(console, "log").mockImplementation();
  const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

  Runner.run(source);

  const result = {
    logs: consoleLogSpy.mock.calls.map((args) => args[0]),
    errors: consoleErrorSpy.mock.calls.map((args) => args[0]),
  };

  consoleLogSpy.mockRestore();
  consoleErrorSpy.mockRestore();

  return result;
}
