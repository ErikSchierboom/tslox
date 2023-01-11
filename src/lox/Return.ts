export class Return extends Error {
  constructor(readonly value: unknown) {
    super();
  }
}
