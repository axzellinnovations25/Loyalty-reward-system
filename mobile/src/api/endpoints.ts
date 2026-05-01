export const endpoints = {
  auth: {
    login: '/auth/login',
    me: '/auth/me',
  },
  customers: {
    list: '/customers',
  },
} as const;

