import { inject, Injectable } from '@angular/core';
import { addDoc, collection, doc, Firestore, getDocs, getDoc, writeBatch, QuerySnapshot } from '@angular/fire/firestore';
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

  async getTransactions(userId: string): Promise<Transaction[]> {
    const transactionsRef = collection(this.firestore, `users/${userId}/transactions`);
    const docSnap = await getDocs(transactionsRef);

    const transactions: Transaction[] = [];
    docSnap.forEach((doc)=> {
      const data = doc.data();

      const date = data['date']?.toDate() || new Date();
      transactions.push({id: doc.id, ...data, date: date } as Transaction);
    }); 
    console.log(transactions)
    return transactions   

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
    return accountRef.id
  }

  async getSavingAccounts(userId: string): Promise <SavingAccount[]>{
    const accountCollection = collection(this.firestore, `users/${userId}/saving_accounts`);
    const accountRef = await getDocs(accountCollection);

    const accounts: SavingAccount[] = [];
    accountRef.forEach((doc)=> {
      const data = doc.data();

      const date = data['date']?.toDate() || new Date();
      accounts.push({id: doc.id, ...data, date:date} as SavingAccount);
    });
    console.log(accounts)
    return accounts

  }


}