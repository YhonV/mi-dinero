import { inject, Injectable } from '@angular/core';
import { addDoc, collection, doc, Firestore, getDocs, getDoc, deleteDoc, updateDoc, query, where, setDoc, Timestamp } from '@angular/fire/firestore';
import { Comuna, User, Transaction, Category, Budget, Bank, SavingAccount, TipFinanciero, FAQ } from '../../models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {
  
  private firestore = inject(Firestore)
  private n : number = 0;

  getFirestoreInstance() {
    return this.firestore;
  }

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

  async getGenericDocument (path: string, subPath? : string){
  const collectionRef = doc(this.firestore, `${path}/${subPath}`)
  const snapshot = await getDoc(collectionRef);
    return snapshot;
  }

  async getCollectionInUsers (userUID: string, path: string){
    const collectionRef = collection(this.firestore, `users/${userUID}/${path}`)
    const snapshot = await getDocs(collectionRef);
    return snapshot;
  }

  async getGenericCollection<T>(collectionName: string): Promise<T[]> {
    try {
      const collectionRef = collection(this.firestore, `${collectionName}`);
      const snapshot = await getDocs(collectionRef);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];
    } catch (error) {
      console.error('Error al obtener la colección:', error);
      throw error;
    }
  }

  async getTipsFinancieros(): Promise<TipFinanciero[]> {
    try {
      const cachedTips = sessionStorage.getItem('tips_financieros');
      if (cachedTips) {
        return JSON.parse(cachedTips);
      }

      const snapshot = await this.getGenericCollection<TipFinanciero>('tips_financieros');
      const tips: TipFinanciero[] = [];
      
      snapshot.forEach((doc) => {
        tips.push({
          id: (doc as any).id,
          ...(doc as any)
        } as TipFinanciero);
      });

      sessionStorage.setItem('tips_financieros', JSON.stringify(tips));
      return tips;
    } catch (error) {
      console.error('Error al obtener tips:', error);
      throw error;
    }
  }

  async getFAQs(): Promise<FAQ[]> {
    try {
      // Intentar obtener del caché primero
      const cachedFAQs = sessionStorage.getItem('preguntas_frecuentes');
      if (cachedFAQs) {
        return JSON.parse(cachedFAQs);
      }

      // Si no está en caché, obtener de Firestore
      const snapshot = await this.getGenericCollection<FAQ>('preguntas_frecuentes');
      
      // Guardar en caché
      sessionStorage.setItem('preguntas_frecuentes', JSON.stringify(snapshot));
      
      return snapshot;
    } catch (error) {
      console.error('Error al obtener preguntas frecuentes:', error);
      throw error;
    }
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

  async getIngresosAgrupados(userId:string, desde:Date, hasta:Date): Promise <{
    porCategoria: { [catId: string]: number },
    porFecha: { [fecha: string]: number }}> {
    const transactionCollection = collection(this.firestore, `users/${userId}/transactions`);
    const ingresosQuery = query(transactionCollection, where('type', '==', 'ingreso'), where('date', '>=', desde), where('date', '<=', hasta));
    const snapshot = await getDocs(ingresosQuery)
    const porCategoria: { [catId: string]: number } = {};
    const porFecha: { [fecha: string]: number } = {};

    snapshot.forEach((docSnap)=> {
      const data = docSnap.data() as Transaction;
      const catId = data.categoryId;
      const fecha = this.normalizarFecha(data.date);
      const monto = data.amount;

       // Por categoría total
      porCategoria[catId] = (porCategoria[catId] || 0) + monto;

      // Por fecha total
      porFecha[fecha] = (porFecha[fecha] || 0) + monto;

    });
    return {
      porCategoria,
      porFecha
    };
  }


  normalizarFecha(fecha: any): string{
    const fec = fecha instanceof Timestamp ? fecha.toDate() : new Date(fecha);
    return fec.toISOString().split('T')[0];
  }

  async getGastosAgrupados(
  userId: string,
  desde: Date,
  hasta: Date
): Promise<{
  porCategoria: { [catId: string]: number },
  porFecha: { [fecha: string]: number },
}> {
  const transactionCollection = collection(this.firestore, `users/${userId}/transactions`);
  const gastosQuery = query(
    transactionCollection,
    where('type', '==', 'gasto'),
    where('date', '>=', desde),
    where('date', '<=', hasta)
  );

  const snapshot = await getDocs(gastosQuery);

  const porCategoria: { [catId: string]: number } = {};
  const porFecha: { [fecha: string]: number } = {};

  snapshot.forEach((docSnap) => {
    const data = docSnap.data() as Transaction;
    const fecha = this.normalizarFecha(data.date);
    const catId = data.categoryId || 'sin_categoria';
    const monto = data.amount;

    // Por categoría total
    porCategoria[catId] = (porCategoria[catId] || 0) + monto;

    // Por fecha total
    porFecha[fecha] = (porFecha[fecha] || 0) + monto;
  });

  return {
    porCategoria,
    porFecha
  };
}


  async createBudget(userId: string, budget : Budget ){
    const collectionBudget = collection(this.firestore,`users/${userId}/budget`);
    const docRef = await addDoc(collectionBudget, {
      id: this.n, budget
    })

    return docRef.id
  }

  async getBanks(): Promise <Bank[]> {
    const collectionBank = collection(this.firestore, "banks");
    const allBanks = await getDocs(collectionBank);
    let banks: Bank[] = []
    
    allBanks.docs.forEach((doc) => {
      const data = doc.data();
      if (data["banks"]){
        banks = data["banks"] as Bank[];
      }
    });
    return banks;
  } 

  async createSavingAccount(userId:string, accountData: SavingAccount): Promise <string>{
    const accountCollection = collection(this.firestore, `users/${userId}/saving_accounts`);
    const accountRef = await addDoc(accountCollection, {
      ...accountData,
      date: new Date()
    });

    await updateDoc(accountRef, {id: accountRef.id});
    return accountRef.id;
  }

  async deleteSavingAccount(userId: string, cuenta: SavingAccount) {
      const accountRef = doc(this.firestore, `users/${userId}/saving_accounts/${cuenta.id}`);
      await deleteDoc(accountRef);
    }
  
  async updateSavingAccount(userId: string, cuenta: SavingAccount): Promise <void> {
    const accountRef = doc(this.firestore, `users/${userId}/saving_accounts/${cuenta.id}`);
    await updateDoc(accountRef, {
      nombre: cuenta.nombre,
      amount: cuenta.amount,
      bankId: cuenta.bankId,
      date: cuenta.date
    });
  }

  async editBudget(newBudget : Budget, uid: string){
    await updateDoc(doc(this.firestore, `users/${uid}/budget/${newBudget.docId}`),{
      "budget.amount": newBudget.amount,
      "budget.categoryId": newBudget.categoryId
    });
  }

  async deleteBudget(budget: Budget, userId: string) {
    const budgetRef = doc(this.firestore, `users/${userId}/budget/${budget.docId}`);
    await deleteDoc(budgetRef);
  }

  async updateBudget(userId: string, docId: string, newAmount: number): Promise<void> {
    const budgetRef = doc(this.firestore, `users/${userId}/budget/${docId}`);
    await updateDoc(budgetRef, {
        'budget.amount': newAmount
    });
}

  async deleteDocument(docId: string, path: string) {
    const genericPath = doc(this.firestore, `${path}/${docId}`)
    await deleteDoc(genericPath)
  }

  deleteTransaction(uid: string, docId: string) {
    const path = `users/${uid}/transactions/${docId}`;
    return deleteDoc(doc(this.firestore, path));
  }

  async createLog(userId: string, message: string, tipo: string) {
    const logCollection = collection(this.firestore, 'logs'); 
    await addDoc(logCollection, {
      userId,
      mensaje: message,
      tipo,
      fecha: new Date() 
    });
  }

  async guardarTokenEnFirestore(token: string, uid: string) {
    const tokenRef = doc(this.firestore, 'fcm_tokens', token);
    await setDoc(tokenRef, {
            userId: uid,
            createdAt: new Date(),
        });
    console.log("Token guardado en Firestore exitosamente.");
  }

  /**
   * Obtiene la referencia a un documento de presupuesto específico.
   * @param uid ID del usuario
   * @param budgetDocId ID del documento del presupuesto
   * @returns Una DocumentReference al presupuesto
   */
  getBudgetDocRef(uid: string, budgetDocId: string) {
    return doc(this.firestore, `users/${uid}/budget/${budgetDocId}`);
  }

  /**
   * Crea una referencia para un nuevo documento en la colección de transacciones del usuario.
   * @param uid ID del usuario
   * @returns Una DocumentReference para una nueva transacción.
   */
  getNewTransactionDocRef(uid: string) {
    const transactionsCollectionRef = collection(this.firestore, `users/${uid}/transactions`);
    return doc(transactionsCollectionRef); // Genera una referencia con un ID automático
  }

}