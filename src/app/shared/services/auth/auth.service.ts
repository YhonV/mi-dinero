import { inject, Injectable } from '@angular/core';
import { User } from '../../models/interfaces';
import { createUserWithEmailAndPassword, Auth, signInWithEmailAndPassword } from '@angular/fire/auth';
import { setDoc, doc, collection, Firestore } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class AuthService{
  private _auth = inject(Auth);
  private firestore = inject(Firestore)
  constructor() { }

  // async fillComunas(){
  //   const comunas = collection(this.firestore, "direccion");
  //   if (!comunas){
  //     console.log("No se encontró comunas")
  //   }
  //   await setDoc(doc(comunas, 'comunas'), { comunas: this.comunas });
  //   console.log(comunas)
  // }

  signUp(user: User) {
    return createUserWithEmailAndPassword(this._auth, user.email, user.password);
  }

  signIn(user: User){
    return signInWithEmailAndPassword(this._auth, user.email, user.password);
  }
}
