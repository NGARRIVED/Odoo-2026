/**
 * Lightweight JWT-payload reader.
 * Reads the assetflow_token from localStorage and returns the decoded payload.
 * Does NOT verify the signature — signature is verified server-side.
 */
export function getTokenPayload() {
  try {
    const token = localStorage.getItem('assetflow_token');
    if (!token) return null;
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(json); // { employeeId, role, iat, exp }
  } catch {
    return null;
  }
}

/** Returns the current user's role string, e.g. 'ADMIN', 'EMPLOYEE', or null */
export function getCurrentRole() {
  return getTokenPayload()?.role ?? null;
}

/** Returns true only if the logged-in user is ADMIN */
export function isAdmin() {
  return getCurrentRole() === 'ADMIN';
}

/** Returns true if the logged-in user is ADMIN or ASSET_MANAGER */
export function isManagerOrAbove() {
  const role = getCurrentRole();
  return role === 'ADMIN' || role === 'ASSET_MANAGER';
}

/** Returns the Authorization header for fetch calls */
export function authHeader() {
  const token = localStorage.getItem('assetflow_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}
