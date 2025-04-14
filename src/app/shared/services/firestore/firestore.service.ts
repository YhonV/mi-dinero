import { inject, Injectable } from '@angular/core';
import { addDoc, collection, doc, Firestore, getDocs, getDoc, writeBatch } from '@angular/fire/firestore';
import { Comuna, User, Transaction, Category } from '../../models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {
  
  private firestore = inject(Firestore)

  // categoriasIngreso: Category[] = [
  //   { id: 'ingresos', nombre: 'Salario', icono: 'cash-outline' },
  //   { id: 'ingresos', nombre: 'Inversiones', icono: 'bar-chart-outline' },
  //   { id: 'ingresos', nombre: 'Ventas', icono: 'cart-outline' },
  //   { id: 'ingresos', nombre: 'Regalos recibidos', icono: 'gift-outline' },
  //   { id: 'ingresos', nombre: 'Otros ingresos', icono: 'cash-outline' },
  // ];

  // // Categorías de gastos
  // categoriasGasto: Category[] = [
  //   { id: 'gastos', nombre: 'Alimentación', icono: 'fast-food-outline' },
  //   { id: 'gastos', nombre: 'Transporte', icono: 'car-outline' },
  //   { id: 'gastos', nombre: 'Vivienda', icono: 'home-outline' },
  //   { id: 'gastos', nombre: 'Entretenimiento' , icono: 'film-outline'},
  //   { id: 'gastos', nombre: 'Servicios' , icono: 'bulb-outline'},
  //   { id: 'gastos', nombre: 'Salud', icono: 'medkit-outline' },
  //   { id: 'gastos', nombre: 'Ropa y accesorios', icono: 'shirt-outline' },
  //   { id: 'gastos', nombre: 'Educación', icono: 'school-outline' },
  //   { id: 'gastos', nombre: 'Otros gastos', icono: 'cash-outline' },
  // ];


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

  async createTransaction(
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

  // async getTransactions(userId: string): Promise<Transaction[]> {
  //   const transactionCollection = collection(
  //     this.firestore, `users/${userId}/transactions`
  //   );
  //   const transactionSnapshot = await getDocs(transactionCollection);
  //   const transactions: Transaction[] = [];

  //   transactionSnapshot.forEach((doc) => {
  //     const data = doc.data() as Transaction;
  //     const date = new Date('yyyy-mm-dd-hh:mm:ss');
  //     transactions.push({
  //       ...data,
  //       id: doc.id,
  //       date: date
  //     });
  //   });
  //   return transactions;
  // }

  
  // async initializeCategories(): Promise<void> {
  //   try {
  //     const batch = writeBatch(this.firestore);
      
  //     // Documento para gastos con array de categorías
  //     const gastosRef = doc(this.firestore, "categories", "gastos");
  //     batch.set(gastosRef, {
  //       categorias: this.categoriasGasto.map(cat => ({
  //         nombre: cat.nombre,
  //         icono: cat.icono || null
  //       }))
  //     });
      
  //     // Documento para ingresos con array de categorías
  //     const ingresosRef = doc(this.firestore, "categories", "ingresos");
  //     batch.set(ingresosRef, {
  //       categorias: this.categoriasIngreso.map(cat => ({
  //         nombre: cat.nombre,
  //         icono: cat.icono || null
  //       }))
  //     });
  
  //     await batch.commit();
  //     console.log("Categorías inicializadas correctamente.");
  //   } catch (error) {
  //     console.error("Error al inicializar categorías:", error);
  //     throw error;
  //   }
  // }
  
  async getUser(uid : string){
    const docRef = doc(this.firestore, "users", uid);
    const userSnapshot = await getDoc(docRef);
    if (userSnapshot){
      const user = userSnapshot.data() as User;
      return user;
    }
    return null;
  }

  async getCategoriesGastos(): Promise<Category[]> {
    const docRef = doc(this.firestore, "categories", "gastos");
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return data['categorias'] || [];
    } else {
      console.log("El documento no existe");
      return [];
    }
  }

  async getCategoriesIngresos(): Promise<Category[]> {
    const docRef = doc(this.firestore, "categories", "ingresos");
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return data['categorias'] || [];
    } else {
      console.log("El documento no existe");
      return [];
    }
  }


}
 

