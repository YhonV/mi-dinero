import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Transaction, Category, User, Budget } from 'src/app/shared/models/interfaces';
import { Router } from '@angular/router';
import { FirestoreService } from 'src/app/shared/services/firestore/firestore.service';
import { IonIcon, IonContent, IonItemSliding, IonItemOptions, IonItemOption, IonItem }   from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cashOutline, fastFoodOutline, carOutline, homeOutline, filmOutline, bulbOutline, medkitOutline, shirtOutline, schoolOutline, barChartOutline, cartOutline, giftOutline, close, trashOutline} from 'ionicons/icons';
import { toast } from 'ngx-sonner';
import { UtilsService } from 'src/app/shared/utils/utils.service';
import { UserService } from 'src/app/shared/services/user/user.service';
import { HomeService } from 'src/app/shared/services/home/home.service';
import { BudgetService } from 'src/app/shared/services/budget/budget.service';
import { PushNotifications } from '@capacitor/push-notifications';

@Component({
  selector: 'app-home',
  imports: [CommonModule, FormsModule, IonIcon, IonContent, IonItemSliding, IonItemOptions, IonItemOption, IonItem],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent  implements OnInit {
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
  userData: User | null = null
  currentPage: number = 1;
  itemsPerPage: number = 5;
  formattedAmount : string = '';
  presupuestosActuales: Budget[] = [];
  showConfirmDelete = false;

  constructor(
    private userService: UserService,
    private homeService: HomeService,
    private budgetService: BudgetService) {
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
      giftOutline,
      close,
      trashOutline
    })
  }

  async ngOnInit() {  
    const loading = await this._utils.loadingSpinner();
    await loading.present();
    this.registrarParaNotificaciones()
    await this.loadCategories();
    await this.userService.waitForAuth();

     if (this.userService.isAuthenticated()) {
      this.userData = this.userService.getUser();
      this.uid = this.userService.getUid();
      
      await Promise.all([
        this.loadTransactions(),
        this.loadBudgets(this.uid)
      ]);
      await loading.dismiss();
    }
    await loading.dismiss();
    this.budgetService.presupuestoActualizado$.subscribe(() => {
      this.loadBudgets(this.uid);
    });
  }

  async registrarParaNotificaciones(){
    let permStatus = await PushNotifications.checkPermissions();
    console.log("Entré en registrar notificaciones")
    console.log(this.uid)
    if (permStatus.receive === "prompt"){
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== "granted"){
      throw new Error("El usuario no concedió permisos para recibir notificaciones")
    }

    await PushNotifications.register();

    PushNotifications.addListener("registration", async (token) => {
      console.log(this.uid)
      console.log("Token FCM obtenido " + token.value);
      await this._firestore.guardarTokenEnFirestore(token.value, this.uid)
    });

    PushNotifications.addListener('registrationError', (err) => {
      console.error('Error al registrar notificaciones:', err.error);
    });
  }

  


  private async loadCategories() {
    const cachedGastos = sessionStorage.getItem('categoriasGasto');
    const cachedIngresos = sessionStorage.getItem('categoriasIngreso');

    if (!cachedIngresos || !cachedGastos) {
      const [catGastos, catIngresos] = await Promise.all([
        this._firestore.getCategoriesGastos(),
        this._firestore.getCategoriesIngresos()
      ]);
      sessionStorage.setItem('categoriasGasto', JSON.stringify(catGastos));
      sessionStorage.setItem('categoriasIngreso', JSON.stringify(catIngresos));
      this.categoriasGasto = catGastos;
      this.categoriasIngreso = catIngresos;
    } else {
      this.categoriasGasto = JSON.parse(cachedGastos);
      this.categoriasIngreso = JSON.parse(cachedIngresos);
    }
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

      this.presupuestosActuales = budgets.map(budget => ({
        id: budget.id,
        categoryId: budget.categoryId,
        amount: budget.amount,
        docId: budget.docId
      }))
    }

  async loadTransactions(){
    if (this.uid){
      const genericsTransactions = await this._firestore.getCollectionInUsers(this.uid, 'transactions')
      const transactions: Transaction[] = [];
      genericsTransactions.forEach((doc)=> {
        const data = doc.data();
        const date = data['date']?.toDate() || new Date();
         transactions.push({
          docId: doc.id,  // ID del documento en Firestore
          id: data["id"],    // ID de la transacción
          ...data, 
          date: date 
        } as Transaction);
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

  async eliminarTransaccion(transaction: Transaction): Promise<void> {
    if (!transaction.docId) {
      toast.error('❌ No se puede eliminar la transacción');
      return;
    }

    try {
      await this._firestore.deleteTransaction(this.uid, transaction.docId);
      await this.loadTransactions();
      toast.success('✅ Transacción eliminada exitosamente');
    } catch (error) {
      console.error('Error al eliminar:', error);
      toast.error('❌ Error al eliminar la transacción');
    }
  }
 
  async guardarTransaccion(): Promise<void> {
    if (this.monto <= 0 || this.categoriaSeleccionada === '') {
      console.error('Por favor, completa todos los campos correctamente.');
      return;
    }

    if (this.tipoSeleccionado === 'gasto'){
      const presupuestoActual = this.presupuestosActuales.find(p => p.categoryId === this.categoriaSeleccionada);
      console.log(presupuestoActual)
      if (presupuestoActual){
        if (this.monto > presupuestoActual.amount) {
          toast.error(`❌ El gasto excede el presupuesto disponible para ${this.categoriaSeleccionada} (${this._utils.currencyFormatter({currency: "CLP", value: presupuestoActual.amount})})`);
          return;
        } else {
          presupuestoActual.amount -= this.monto;
          if(presupuestoActual.amount == 0) {
            await this._firestore.deleteBudget(presupuestoActual, this.uid)
            toast.info("El presupuesto quedó sin fondos, se procede a eliminar")
          }
        }
        const budgetDoc = await this._firestore.getCollectionInUsers(this.uid, 'budget');
        const docToUpdate = budgetDoc.docs.find(doc => doc.data()["budget"]?.categoryId === this.categoriaSeleccionada);
        if (docToUpdate) {
          await this._firestore.updateBudget(this.uid, docToUpdate.id, presupuestoActual.amount);
        }
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

    toast.success('✅ Transacción creada exitosamente')
    this.closeModal()
    
    await this._firestore.createTransaction(this.uid, transaction);
    await Promise.all([
      this.loadBudgets(this.uid),
      this.loadTransactions()
    ]);
    
    this.monto = 0;
    this.categoriaSeleccionada = ''
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
  const saldoFormateado = this._utils.currencyFormatter({
    currency: "CLP",
    value: totalSaldo
  });
  
  this.homeService.updateSaldo(totalSaldo);
  return saldoFormateado;
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
