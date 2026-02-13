import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import type { $ZodIssue } from 'zod/v4/core';

/**
 * Formats a list of ZodIssues into a single human-readable message that lists
 * all failing fields, e.g. "equipmentId: Required; endDate: Invalid date format."
 */
function formatZodIssues(issues: $ZodIssue[]): string {
  return issues.map((issue) => `${issue.path.join('.') || 'body'}: ${issue.message}`).join('; ');
}

/**
 * Returns an Express middleware that validates `req.body` against the given
 * Zod schema.  On success the parsed (and coerced) body is written back to
 * `req.body` so downstream handlers receive clean data.  On failure a 400
 * response is sent in the standard `{ error: { code, message } }` format.
 *
 * When `req.body` is undefined (e.g., DELETE requests without a body),
 * it is treated as an empty object `{}` before validation so that schemas
 * containing only optional fields continue to pass.
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Treat a missing body (common on DELETE without Content-Type) as {}
    const input = req.body !== undefined && req.body !== null ? req.body : {};

    const result = schema.safeParse(input);

    if (!result.success) {
      const message = formatZodIssues(result.error.issues);
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message,
        },
      });
      return;
    }

    // Replace req.body with the validated (and potentially coerced) data
    req.body = result.data;
    next();
  };
}
