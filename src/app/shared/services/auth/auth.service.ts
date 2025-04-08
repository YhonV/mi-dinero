import { inject, Injectable } from '@angular/core';
import { User } from '../../models/interfaces';
import { createUserWithEmailAndPassword, Auth, signInWithEmailAndPassword, sendPasswordResetEmail, signOut } from '@angular/fire/auth';
import { setDoc, doc, collection, Firestore } from '@angular/fire/firestore';
import { UtilsService } from '../../utils/utils.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService{
  private _auth = inject(Auth);
  private firestore = inject(Firestore)
  private _utils = inject(UtilsService);
  constructor() { }

  async createUser(uid : string, username: string, region: string, comuna: string, email: string){
    await setDoc(doc(this.firestore, "users", uid),{
      username, region, comuna, email
    })
  }

  signUp(user: User) {
    return createUserWithEmailAndPassword(this._auth, user.email, user.password);
  }

  signIn(user: User){
    return signInWithEmailAndPassword(this._auth, user.email, user.password);
  }

  recoveryPassword(email: string){
    return sendPasswordResetEmail(this._auth, email);
  }

  async signOutFirebase(){
    signOut(this._auth).then(() =>{
      console.log("Deslogeado perfecto")
      window.location.href = '/auth/sign-in'; 
    }).catch((error) =>{

    })
  }
}
