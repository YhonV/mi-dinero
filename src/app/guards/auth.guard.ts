import { Injectable } from '@angular/core';
import { Auth, getAuth, onAuthStateChanged } from '@angular/fire/auth';
import { CanActivate, Router } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class authGuard implements CanActivate {
  constructor(private router: Router, private auth: Auth) {}
  canActivate(): boolean | Observable<boolean> | Promise<boolean> {
    return new Promise((resolve) => {

      onAuthStateChanged(this.auth, (user) => {
        if (user) {
          resolve(true);
        } else {
          console.log('User is not logged in');
          this.router.navigate(['/auth/sign-in']);
          resolve(false);
        }
      });
    });
  }
};
