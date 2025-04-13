import { inject, Injectable } from '@angular/core';
import { collection, Firestore, getDocs, getDoc, doc } from '@angular/fire/firestore';
import { Comuna, User } from '../../models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {
  
  private firestore = inject(Firestore)

  async getDirecciones(): Promise<Comuna[]> {
    const collectionDireccion = collection(this.firestore, "direccion");
    const allComunas = await getDocs(collectionDireccion);
    
    let comunas: Comuna[] = [];
    
    allComunas.docs.forEach((doc) => {
      const data = doc.data();
      if (data["comunas"]) {
        comunas = data["comunas"] as Comuna[];
      }
    });
    return comunas;
  }

  async getUser(uid : string): Promise<User | null> {
    const docRef = doc(this.firestore, "users", uid);
    const userSnapshot = await getDoc(docRef);
    if (userSnapshot){
      const user = userSnapshot.data() as User;
      console.log(user);
      return user;
    }
    return null;
  }

}
