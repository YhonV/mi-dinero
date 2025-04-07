import { Injectable } from '@angular/core';
import { Auth, getAuth, onAuthStateChanged } from '@angular/fire/auth';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class noAuthGuard implements CanActivate {
  constructor(private router: Router, private auth: Auth) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | Observable<boolean> | Promise<boolean> {
    return new Promise((resolve) => {
      // const auth = getAuth();

      onAuthStateChanged(this.auth, (user) => {
        if (user) {
          if (state.url === '/auth/sign-in') {
            console.log('User is logged in, allowing access to login page');
            resolve(true);
          } else {
            console.log('User is logged in, navigating to home');
            this.router.navigate(['/navbar/home']);
            resolve(false);
          }
        } else {
          console.log('User is not logged in, allowing access');
          resolve(true);
        }
      });
    });
  }
};
