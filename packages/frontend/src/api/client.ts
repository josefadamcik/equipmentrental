/**
 * Base API client for the Equipment Rental System.
 *
 * The base URL is read from the VITE_API_URL environment variable.
 * When developing locally it defaults to '' (empty string), so all requests
 * go to the same origin and the Vite dev-server proxy forwards /api/* to the
 * backend running on port 3000.
 */

import type { ApiError } from '../types/api';

const BASE_URL: string = (import.meta.env.VITE_API_URL as string | undefined) ?? '';

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------

/**
 * A typed error class that wraps the structured error body returned by the API.
 */
export class ApiRequestError extends Error {
  public readonly status: number;
  public readonly body: ApiError;

  constructor(status: number, body: ApiError) {
    super(body.error?.message ?? `HTTP ${status}`);
    this.name = 'ApiRequestError';
    this.status = status;
    this.body = body;
  }
}

// ---------------------------------------------------------------------------
// Core request function
// ---------------------------------------------------------------------------

/**
 * Generic typed fetch wrapper.
 *
 * @param path    - Path relative to BASE_URL, must start with '/'
 * @param options - Standard RequestInit options
 * @returns       - Parsed JSON response typed as T
 * @throws        - ApiRequestError when the response status is >= 400
 */
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${path}`;

  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  // Parse body whether success or error (the API always returns JSON)
  let body: unknown;
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    body = await response.json();
  } else {
    body = null;
  }

  if (!response.ok) {
    // Normalise whatever the server sent into our ApiError shape
    const errorBody: ApiError =
      body !== null && typeof body === 'object' && 'error' in (body as object)
        ? (body as ApiError)
        : {
            error: {
              code: 'UNKNOWN_ERROR',
              message: `Request failed with status ${response.status}`,
            },
          };

    throw new ApiRequestError(response.status, errorBody);
  }

  return body as T;
}

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

/** HTTP GET */
export function get<T>(path: string): Promise<T> {
  return request<T>(path, { method: 'GET' });
}

/** HTTP POST with a JSON body */
export function post<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/** HTTP PUT with a JSON body */
export function put<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

/** HTTP DELETE, optionally with a JSON body */
export function del<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, {
    method: 'DELETE',
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}
