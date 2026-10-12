import { LOGIN_URL } from './conf';

export const authUrl = ({ silent = false } = {}) => {
  const url = new URL(LOGIN_URL);
  if (silent) {
    url.searchParams.set('silent', 'true');
  }
  // Served under a sub-path (e.g. /notaires/): come back there, not to "/".
  if (import.meta.env.BASE_URL !== '/') {
    url.searchParams.set('next', import.meta.env.BASE_URL);
  }
  return url;
};
