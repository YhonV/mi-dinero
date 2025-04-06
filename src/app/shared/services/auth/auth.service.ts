import { inject, Injectable } from '@angular/core';
import { User } from '../../models/interfaces';
import { createUserWithEmailAndPassword, Auth, signInWithEmailAndPassword } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private _auth = inject(Auth);
  constructor() { }

  signUp(user: User) {
    return createUserWithEmailAndPassword(this._auth, user.email, user.password);
  }

  signIn(user: User){
    return signInWithEmailAndPassword(this._auth, user.email, user.password);
  }
}
