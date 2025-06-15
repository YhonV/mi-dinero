// not-admin-user.guard.ts
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { UserService } from '../shared/services/user/user.service';

export const notAdminUserGuard: CanActivateFn = async () => {
  const userService = inject(UserService);
  const router = inject(Router);

  await userService.waitForAuth();

  if (userService.isAdmin()) {
    router.navigate(['/admin']);
    return false;
  }

  return true;
};
