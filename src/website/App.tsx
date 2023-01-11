import React, { FormEvent, useState } from "react";
import { Run, Runner } from "../lox/Runner";

export function App() {
  const [run, setRun] = useState<Run | undefined>(undefined);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  const handleChange = function (event: FormEvent<HTMLTextAreaElement>) {
    const source = event.currentTarget.value;
    const newRun = Runner.run(source);
    setRun(newRun);
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <label>
          Source code:
          <textarea onChange={handleChange} />
        </label>
      </form>

      {run === undefined ? null : (
        <>
          <div>
            Tokens:
            <ol>
              {run.tokens.map((token, i) => (
                <li key={i}>{JSON.stringify(token)}</li>
              ))}
            </ol>
          </div>
          <div>
            Statements:
            <ol>
              {run.statements.map((statement, i) => (
                <li key={i}>{JSON.stringify(statement)}</li>
              ))}
            </ol>
          </div>
          <div>
            Output:
            <ol>
              {run.output.map((output, i) => (
                <li key={i}>{output}</li>
              ))}
            </ol>
          </div>
          <div>
            Parse errors:
            <ol>
              {run.parseErrors.map((error, i) => (
                <li key={i}>{error.message}</li>
              ))}
            </ol>
          </div>
          <div>
            Runtime errors:
            <ol>
              {run.runtimeErrors.map((error, i) => (
                <li key={i}>{error.message}</li>
              ))}
            </ol>
          </div>
        </>
      )}
    </div>
  );
}
