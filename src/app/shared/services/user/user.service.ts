import { Injectable } from '@angular/core';
import { User } from '../../models/interfaces';
import { FirestoreService } from '../firestore/firestore.service';
import { Auth } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private userData : User | null = null;
  private uid: string = ''
  private authPromise: Promise<void>;

  constructor(private _auth: Auth, private _firestore: FirestoreService) {
    this.authPromise = new Promise((resolve) => {
      this._auth.onAuthStateChanged(async user => {
        if (user) {
          this.uid = user.uid;
          const cachedUser = sessionStorage.getItem('userData');
          if (cachedUser) {
            this.userData = JSON.parse(cachedUser);
          } else {
            this.userData = await this._firestore.getUser(user.uid);
            sessionStorage.setItem('userData', JSON.stringify(this.userData));
          }
        } else {
          this.userData = null;
          this.uid = '';
          sessionStorage.removeItem('userData');
        }
        resolve();
      });
    });
  }

  async refreshUserData(): Promise<void> {
    if (this.uid) {
      this.userData = await this._firestore.getUser(this.uid);
      sessionStorage.setItem('userData', JSON.stringify(this.userData));
    }
  }

   async waitForAuth(): Promise<void> {
    return this.authPromise;
  }

  getUser(): User | null {
    return this.userData;
  }

  getUid(): string {
    return this.uid;
  }

  isAuthenticated(): boolean {
    return !!this.userData;
  }
}
