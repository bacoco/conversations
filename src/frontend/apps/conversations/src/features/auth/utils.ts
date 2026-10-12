import { User } from './api/types';
import { authUrl } from './authUrl';
import { LOGOUT_URL, PATH_AUTH_LOCAL_STORAGE } from './conf';

/** Safe email for display, since the API may return a null email. */
export const getUserEmail = (user: User) => user.email ?? '';

/** Best available display name, falling back through email/short name to a default. */
export const getUserFullName = (user: User, fallback: string) =>
  user.full_name || user.email || user.short_name || fallback;

export const getAuthUrl = () => {
  const path_auth = localStorage.getItem(PATH_AUTH_LOCAL_STORAGE);
  if (path_auth) {
    localStorage.removeItem(PATH_AUTH_LOCAL_STORAGE);
    return path_auth;
  }
};

export const setAuthUrl = () => {
  // The router adds its base path itself (e.g. /notaires/).
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const path = window.location.pathname.slice(base.length) || '/';
  if (path !== '/') {
    localStorage.setItem(PATH_AUTH_LOCAL_STORAGE, path);
  }
};

export const gotoLogin = (withRedirect = true) => {
  if (withRedirect) {
    setAuthUrl();
  }

  window.location.replace(authUrl().href);
};

export const gotoLogout = () => {
  window.location.replace(LOGOUT_URL);
};
