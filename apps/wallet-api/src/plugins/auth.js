/**
 * Auth middleware helpers.
 *
 * Exposes a small utility used by every route module.
 */

export function isAuthorized(req, tokenHeader, expectedToken) {
  const actual = req.headers[tokenHeader];
  return typeof actual === "string" && actual.length > 0 && actual === expectedToken;
}
