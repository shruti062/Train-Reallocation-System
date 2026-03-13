import { CanActivateFn } from '@angular/router';

export const adminGuard: CanActivateFn = (route, state) => {
   const isAdmin = localStorage.getItem('adminLoggedIn');

  if (isAdmin === 'true') {
    return true;
  }

  window.location.href = '/admin-login';
  return false;
};
