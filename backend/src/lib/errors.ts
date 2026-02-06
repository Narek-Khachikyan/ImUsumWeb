export class ApiError extends Error {
  statusCode: number;

  detail: string;

  headers?: Record<string, string>;

  constructor(statusCode: number, detail: string, headers?: Record<string, string>) {
    super(detail);
    this.statusCode = statusCode;
    this.detail = detail;
    this.headers = headers;
  }
}

export function badRequest(detail = 'Bad request'): never {
  throw new ApiError(400, detail);
}

export function unauthorized(
  detail = 'Could not validate credentials',
  headers: Record<string, string> = { 'WWW-Authenticate': 'Bearer' }
): never {
  throw new ApiError(401, detail, headers);
}

export function forbidden(detail = 'Access denied'): never {
  throw new ApiError(403, detail);
}

export function notFound(detail = 'Resource not found'): never {
  throw new ApiError(404, detail);
}

export function conflict(detail = 'Resource already exists'): never {
  throw new ApiError(409, detail);
}

export function internalServerError(detail = 'Internal Server Error'): never {
  throw new ApiError(500, detail);
}
