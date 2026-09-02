// core/order-routing/errors.ts

export class AppError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, code = "UNKNOWN", statusCode = 400) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
  }
}
