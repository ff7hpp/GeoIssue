import i18n from '../locales/i18n';

export function errorMessage(error: unknown): string {
  const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
  const key = ['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found'].includes(code)
    ? 'credentials'
    : ['auth/email-already-in-use', 'CONFLICT'].includes(code) ? 'duplicate'
    : code === 'auth/weak-password' ? 'password'
    : code === 'UNAUTHENTICATED' ? 'session'
    : code === 'auth/network-request-failed' || error instanceof TypeError ? 'network'
    : 'generic';
  return i18n.t(`errors.${key}`);
}
