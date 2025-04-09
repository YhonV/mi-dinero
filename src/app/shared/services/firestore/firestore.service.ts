import { inject, Injectable } from '@angular/core';
import { collection, Firestore, getDocs } from '@angular/fire/firestore';
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

}
