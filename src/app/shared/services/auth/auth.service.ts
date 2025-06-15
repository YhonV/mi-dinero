import { inject, Injectable } from '@angular/core';
import { User } from '../../models/interfaces';
import { createUserWithEmailAndPassword, Auth, signInWithEmailAndPassword, sendPasswordResetEmail, signOut, updatePassword, EmailAuthProvider, reauthenticateWithCredential, User as FirebaseAuthUser } from '@angular/fire/auth';
import { setDoc, doc, Firestore, updateDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class AuthService{
  private _auth = inject(Auth);
  private firestore = inject(Firestore)

  constructor(private auth: Auth) { }

   getCurrentFirebaseUser(): FirebaseAuthUser | null {
    return this._auth.currentUser;
  }

  async createUser(uid : string, username: string, region: string, comuna: string, email: string){
    await setDoc(doc(this.firestore, "users", uid),{
      username, region, comuna, email
    })
  }

  async editUser(uid : string, username: string, region: string, comuna: string){
    await updateDoc(doc(this.firestore, "users", uid),{
      username, region, comuna
    })
  }

  async reauthenticateUser(user: FirebaseAuthUser, currentPassword: string): Promise<FirebaseAuthUser> {
    if (!user.email) {
      throw new Error('No authenticated user found.');
    }
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    try {
      const result = await reauthenticateWithCredential(user, credential);
      return result.user;
    } catch (error) {
      console.error('Error en la autenticación:', error);
      throw error;
    }
  }

  async editPassword(user: FirebaseAuthUser, newPassword: string): Promise<void> {
    try {
      await updatePassword(user, newPassword);
      console.log('Contraseña actualizada con éxito');
    } catch (error) {
      throw error;
    }
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
      window.location.href = '/auth/sign-in'; 
    }).catch((error) =>{
      console.log(error);
    })
  }
}
