import { inject, Injectable } from '@angular/core';
import { addDoc, collection, doc, Firestore, getDocs, getDoc, deleteDoc, updateDoc } from '@angular/fire/firestore';
import { Comuna, User, Transaction, Category, Budget, Bank, SavingAccount } from '../../models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {
  
  private firestore = inject(Firestore)
  private n : number = 0;

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
    console.log(newBudget.docId)
    await updateDoc(doc(this.firestore, `users/${uid}/budget/${newBudget.docId}`),{
      "budget.amount": newBudget.amount,
      "budget.categoryId": newBudget.categoryId
    });
  }

  async deleteBudget(budget: Budget, userId: string) {
    const budgetRef = doc(this.firestore, `users/${userId}/budget/${budget.docId}`);
    console.log(budget.docId)
    await deleteDoc(budgetRef);
  }

}