import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Transaction, Category, User, Budget } from 'src/app/shared/models/interfaces';
import { Router } from '@angular/router';
import { FirestoreService } from 'src/app/shared/services/firestore/firestore.service';
import { Auth } from '@angular/fire/auth';
import { IonIcon, IonContent }   from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cashOutline, fastFoodOutline, carOutline, homeOutline, filmOutline, bulbOutline, medkitOutline, shirtOutline, schoolOutline, barChartOutline, cartOutline, giftOutline } from 'ionicons/icons';
import { toast } from 'ngx-sonner';
import { UtilsService } from 'src/app/shared/utils/utils.service';

@Component({
  selector: 'app-home',
  imports: [CommonModule, FormsModule, IonIcon, IonContent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export default class HomeComponent  implements OnInit {
  isModalOpen: boolean = false;
  tipoSeleccionado: 'ingreso' | 'gasto' = 'ingreso';
  monto: number= 0;
  categoriaSeleccionada: string = '';
  descripcion: string = '';
  transaction: Transaction[] = [];
  categoriasIngreso: Category[] = [];
  categoriasGasto: Category[] = [];
  uid: string = '';
  categoryIcon : string | undefined;
  private _firestore = inject(FirestoreService); 
  private _utils = inject(UtilsService) 
  router = inject(Router);
  private _auth = inject(Auth)
  userData: User | null = null
  currentPage: number = 1;
  itemsPerPage: number = 5;
  formattedAmount : string = '';
  presupuestosActuales: string[] = [];
  constructor() {
    addIcons({
      cashOutline,
      fastFoodOutline,
      carOutline,
      homeOutline, 
      filmOutline, 
      bulbOutline, 
      medkitOutline, 
      shirtOutline,
      schoolOutline, 
      barChartOutline, 
      cartOutline, 
      giftOutline
    })
  }

  async ngOnInit() {  
    this.categoriasGasto = await this._firestore.getCategoriesGastos()
    this.categoriasIngreso = await this._firestore.getCategoriesIngresos()
    this._auth.onAuthStateChanged(async user => {
      if(user){
        this.uid = user.uid;
        this.loadBudgets(this.uid);
        this.userData = await this._firestore.getUser(user["uid"]);
        this.loadTransactions();
      } else{
        console.log("no user");
        this.userData = null;  
      }
    })

  }

  async loadBudgets(uid : string){
      const budgetsGeneric = await this._firestore.getCollectionInUsers(uid, 'budget');
      let budgets: Budget[] = [];
      
      budgetsGeneric.docs.forEach((doc) => {
        const data = doc.data();
        if (data["budget"]) {
          
          budgets.push({
            id: data["budget"].id,
            categoryId: data["budget"].categoryId,
            amount: data["budget"].amount,
            docId: doc.id,
          });
        }
      });
      this.presupuestosActuales = budgets.map((categoria => categoria.categoryId))
    }

  async loadTransactions(){
    if (this.uid){
      // const rawTransactions = await this._firestore.getTransactions(this.uid);
      const genericsTransactions = await this._firestore.getCollectionInUsers(this.uid, 'transactions')
      const transactions: Transaction[] = [];
      genericsTransactions.forEach((doc)=> {
        const data = doc.data();
        const date = data['date']?.toDate() || new Date();
        transactions.push({id: doc.id, ...data, date: date } as Transaction);
      }); 

      this.transaction = transactions.map(transaction => {
        let iconoCategoria: string;
        
      const formattedAmount = this._utils.currencyFormatter({
          currency: "CLP",
          value: transaction.amount
        })

        if (transaction.type === 'ingreso'){
          const category = this.categoriasIngreso.find(cat => cat.nombre === transaction.categoryId);
          iconoCategoria = category?.icono ?? 'default-icon';
        } else {
          const category = this.categoriasGasto.find(cat => cat.nombre === transaction.categoryId);
          iconoCategoria = category?.icono ?? 'default-icon';
        }
        
        return {
          ...transaction,
          categoryIcon: iconoCategoria,
          formattedAmount // solo para mostrar en el front
        };
      });
    }
  }

  
  openModal() {
    this.isModalOpen = true;
  }
  closeModal() {
    this.isModalOpen = false; 
     
  }

 
  async guardarTransaccion(): Promise<void> {
    if (this.monto <= 0 || this.categoriaSeleccionada === '') {
      console.error('Por favor, completa todos los campos correctamente.');
      return;
    }

    if (this.tipoSeleccionado === 'gasto'){
      if (this.presupuestosActuales.includes(this.categoriaSeleccionada)) {
        
      }
      const saldoActual = this.calcularSaldo();
      const saldoActualLimpio = saldoActual.replace(/[^0-9.-]+/g, "");
      if (this.monto > parseInt(saldoActualLimpio)){
        toast.error('❌ No puedes gastar más de lo que tienes. Tu saldo actual es: $' + saldoActual);        
        return;
      }
    }

    const transaction: Transaction = {
      id: Date.now().toString(),
      type: this.tipoSeleccionado,
      amount: this.monto,
      categoryId: this.categoriaSeleccionada,
      date: new Date()
    }
    await this._firestore.createTransaction(this.uid, transaction)
    toast.success('✅ Transacción creada exitosamente')

    await this.loadTransactions();
    this.monto = 0;
    this.categoriaSeleccionada = ''
    this.closeModal()
  }


  get sortedTransactions(): Transaction[]{
    return this.transaction.slice().sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    })
  }

  calcularIngresos(): string{
    const totalIngresos = this.transaction.reduce((total, t) =>
      t.type === "ingreso" ? total + t.amount : total, 0);

    return this._utils.currencyFormatter({
      currency: "CLP",
      value: totalIngresos
    })
  }

  calcularGastos(): string {
    const totalGastos = this.transaction.reduce((total, t) =>
      t.type === "gasto" ? total + t.amount : total, 0);

    return this._utils.currencyFormatter({
      currency: "CLP",
      value: totalGastos
    })
  }


  calcularSaldo(): string {
    const totalSaldo = this.transaction.reduce((saldo, t) =>
      t.type === "ingreso" ? saldo + t.amount : saldo - t.amount, 0);
    return this._utils.currencyFormatter({
      currency: "CLP",
      value: totalSaldo
    })
  }

  getPageCount(): number {
    return Math.ceil(this.transaction.length / this.itemsPerPage);
  }

  // Función para generar el array de paginación (1, 2, ..., n)
  getPaginationArray(): (number | string)[] {
    const pageCount = this.getPageCount();
    
    // Si hay pocas páginas, mostrar todas
    if (pageCount <= 5) {
      return Array.from({ length: pageCount }, (_, i) => i + 1);
    }
    
    // Si hay muchas páginas, mostrar 1, 2, ..., n-1, n
    const pages: (number | string)[] = [];
    
    // Siempre mostrar la primera página
    pages.push(1);
    
    // Mostrar páginas alrededor de la página actual
    if (this.currentPage > 2) {
      pages.push(2);
    }
    
    if (this.currentPage > 3) {
      pages.push('...');
    }
    
    // Páginas cercanas a la actual
    for (let i = Math.max(2, this.currentPage - 1); i <= Math.min(pageCount - 1, this.currentPage + 1); i++) {
      if (i > 2 && i < pageCount - 1) {
        pages.push(i);
      }
    }
    
    if (this.currentPage < pageCount - 2) {
      pages.push('...');
    }
    
    if (this.currentPage < pageCount - 1) {
      pages.push(pageCount - 1);
    }
    
    // Siempre mostrar la última página
    pages.push(pageCount);
    
    return pages;
  }

  // Función para manejar el cambio de página
  changePage(page: string | number) {
    // Validar que la página esté dentro del rango válido
    if (typeof page === 'string') {
      return;
    }
    
    // Validar que la página esté dentro del rango válido
    if (page < 1 || page > this.getPageCount()) {
      return;
    }
    
    this.currentPage = page;
  }

  get paginatedTransactions(): Transaction[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.sortedTransactions.slice(startIndex, startIndex + this.itemsPerPage);
  }

  navigateTo(path: string) {
    this._utils.navigateToWithoutLoading(path);
  }
  

  


}
