import { inject, Injectable } from '@angular/core';
import { addDoc, collection, doc, Firestore, getDocs, setDoc, writeBatch } from '@angular/fire/firestore';
import { Comuna, User, Transaction, Category } from '../../models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {
  
  private firestore = inject(Firestore)

  categoriasIngreso: Category[] = [
    { id: 'salario', description: 'Salario', type: 'ingreso' },
    { id: 'inversiones', description: 'Inversiones', type: 'ingreso' },
    { id: 'ventas', description: 'Ventas', type: 'ingreso' },
    { id: 'regalos', description: 'Regalos recibidos', type: 'ingreso' },
    { id: 'otros_ingresos', description: 'Otros ingresos', type: 'ingreso' }
  ];

  // Categorías de gastos
  categoriasGasto: Category[] = [
    { id: 'comida', description: 'Alimentación', type: 'gasto' },
    { id: 'transporte', description: 'Transporte', type: 'gasto' },
    { id: 'vivienda', description: 'Vivienda', type: 'gasto' },
    { id: 'entretenimiento', description: 'Entretenimiento' , type: 'gasto'},
    { id: 'servicios', description: 'Servicios' , type: 'gasto'},
    { id: 'salud', description: 'Salud', type: 'gasto' },
    { id: 'ropa', description: 'Ropa y accesorios', type: 'gasto' },
    { id: 'educacion', description: 'Educación', type: 'gasto' },
    { id: 'otros_gastos', description: 'Otros gastos', type: 'gasto' }
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
  
}
 

