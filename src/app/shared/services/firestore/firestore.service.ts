import { inject, Injectable } from '@angular/core';
import { addDoc, collection, doc, Firestore, getDocs, getDoc, writeBatch } from '@angular/fire/firestore';
import { Comuna, User, Transaction, Category } from '../../models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {
  
  private firestore = inject(Firestore)

  categoriasIngreso: Category[] = [
    { id: 'salario', description: 'Salario', type: 'ingreso', icono: 'cash-outline' },
    { id: 'inversiones', description: 'Inversiones', type: 'ingreso', icono: 'bar-chart-outline' },
    { id: 'ventas', description: 'Ventas', type: 'ingreso', icono: 'cart-outline' },
    { id: 'regalos', description: 'Regalos recibidos', type: 'ingreso', icono: 'gift-outline' },
    { id: 'otros_ingresos', description: 'Otros ingresos', type: 'ingreso', icono: 'cash-outline' },
  ];

  // Categorías de gastos
  categoriasGasto: Category[] = [
    { id: 'comida', description: 'Alimentación', type: 'gasto', icono: 'fast-food-outline' },
    { id: 'transporte', description: 'Transporte', type: 'gasto', icono: 'car-outline' },
    { id: 'vivienda', description: 'Vivienda', type: 'gasto', icono: 'home-outline' },
    { id: 'entretenimiento', description: 'Entretenimiento' , type: 'gasto', icono: 'film-outline'},
    { id: 'servicios', description: 'Servicios' , type: 'gasto', icono: 'bulb-outline'},
    { id: 'salud', description: 'Salud', type: 'gasto', icono: 'medkit-outline' },
    { id: 'ropa', description: 'Ropa y accesorios', type: 'gasto', icono: 'shirt-outline' },
    { id: 'educacion', description: 'Educación', type: 'gasto', icono: 'school-outline' },
    { id: 'otros_gastos', description: 'Otros gastos', type: 'gasto', icono: 'cash-outline' },
  ];


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

  async addTransaction(
    userId: string, 
    transactionData: Transaction
  ): Promise <string> {
    const transactionCollection = collection(
      this.firestore, `users/${userId}/transactions`
    );
    const docRef = await addDoc(transactionCollection, {
      ...transactionData, 
      date: new Date()
    });

    return docRef.id;
  }

  
  async initializeCategories(): Promise<void> {
    try {
      const allCategories = [...this.categoriasIngreso, ...this.categoriasGasto];
      const batch = writeBatch(this.firestore);

      allCategories.forEach(category => {
        const docRef = doc(this.firestore, "categories", category.id);
        batch.set(docRef, {
          id: category.id,
          description: category.description,
          type: category.type,
          icono: category.icono || null
        });
      });
      await batch.commit();
      console.log("Categorías inicializadas correctamente.");
    } catch (error) {
      console.error("Error al inicializar categorías:", error);
      throw error;
    }  
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
 

