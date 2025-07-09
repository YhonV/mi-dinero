import { Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { IonContent, IonButton, IonIcon, IonItem, IonInput } from '@ionic/angular/standalone'
import { Chart, registerables } from 'chart.js';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import { trendingUpOutline, addOutline, filmOutline, carOutline, bulbOutline, restaurantOutline, fastFoodOutline, cashOutline, homeOutline, medkitOutline, shirtOutline, schoolOutline, barChartOutline, cartOutline, giftOutline, createOutline, trashOutline, closeOutline } from 'ionicons/icons'; 
import { Budget, Category, TipFinanciero, User } from 'src/app/shared/models/interfaces';
import { FirestoreService } from 'src/app/shared/services/firestore/firestore.service';
import { FormsModule } from '@angular/forms';
import { toast } from 'ngx-sonner';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { UtilsService } from 'src/app/shared/utils/utils.service';
import { UserService } from 'src/app/shared/services/user/user.service';
import { HomeService } from 'src/app/shared/services/home/home.service';
import { BudgetService } from 'src/app/shared/services/budget/budget.service';
Chart.register(...registerables);
@Component({
  selector: 'app-budget',
  templateUrl: './budget.component.html',
  styleUrls: ['./budget.component.scss'],
  imports: [FormsModule, IonContent, IonButton, IonIcon, IonItem, IonInput, CommonModule]
})
export default class BudgetComponent  {

  @ViewChild('chartCanvas') private chartCanvas!: ElementRef;
  private chart: Chart | undefined;
  private _firestore = inject(FirestoreService);
  private _utils = inject(UtilsService);
  saldo: number = 0;
  categoriasGasto: Category[] = [];
  uid: string = '';
  userData: User | null = null
  isModalOpen: boolean = false;
  isModalToEditBudget: boolean = false;
  isModalToDeleteBudget: boolean = false;
  monto: number = 0;
  categoriaSeleccionada: string = '';
  budget : Budget[] = []
  hasBudget : boolean = false
  isLoading: boolean = false;
  dataBudgetToEdit !: Budget;
  dataBudgetToDelete !: Budget;
  private tips: TipFinanciero[] = [];
  currentTip?: TipFinanciero;
  private tipInterval?: any;
  montoFormateado: string = '$0';

  constructor(
    private userService: UserService,
    private homeService: HomeService,
    private budgetService: BudgetService) { 
    addIcons({
      trendingUpOutline, 
      addOutline, 
      filmOutline,
      carOutline,
      bulbOutline, 
      restaurantOutline, 
      cashOutline,
      fastFoodOutline,
      homeOutline,   
      medkitOutline, 
      shirtOutline,
      schoolOutline, 
      barChartOutline, 
      cartOutline, 
      giftOutline,
      createOutline,
      trashOutline,
      closeOutline })
  }

  onMontoInput(event: any) {
    const rawValue = event.target.value.replace(/\D/g, ''); 
    this.monto = Number(rawValue);
    this.montoFormateado = this.formatCLP(this.monto);
  }

  formatCLP(valor: number): string {
    return valor.toLocaleString('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0
    });
  }

  async ionViewWillEnter() {
      this.isLoading = true;
      await this.loadGastos();
      this.homeService.getSaldo().subscribe(saldo => {
        this.saldo = saldo;
      });
      try {
          await this.userService.waitForAuth();
          
          if (this.userService.isAuthenticated()) {
              this.userData = await this._firestore.getUser(this.userService.getUid());
              this.uid = this.userService.getUid();
              await this.getTipsFinancieros()
              await this.loadBudgets(this.uid);
          } else {
              console.log("No user authenticated");
              this.userData = null;
          }
      } catch (error) {
          console.error("Error loading user data:", error);
      } finally {
          this.isLoading = false;
      }
  }

  private async loadGastos(){
    const cachedGastos = sessionStorage.getItem('categoriasGasto');
    if (!cachedGastos) {
      const catGastos = await this._firestore.getCategoriesGastos()
      sessionStorage.setItem('categoriasGasto', JSON.stringify(catGastos));
      this.categoriasGasto = catGastos;
    } else {
      this.categoriasGasto = JSON.parse(cachedGastos);
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

    this.budget = budgets.map(budget => {
      let iconoCategoria: string;
      const category = this.categoriasGasto.find(cat => cat.nombre === budget.categoryId);
      iconoCategoria = category?.icono ?? 'default-icon';

      const montoFormateado =  this._utils.currencyFormatter({
        currency: "CLP",
        value: budget.amount
      })
      return {
        ...budget, iconoCategoria, montoFormateado
      }
    })
    this.hasBudget = true;
    setTimeout(() => {
      if (this.budget.length > 0){
        this.createChart()
      } else{
        console.log('No hay presupuesto guardados')
      }
    }, 1000);
  }

  private createChart(): void {
    if (!this.chartCanvas || !this.budget.length) {
      console.log('No hay datos para mostrar');
      return;
    }
  
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    const labels = this.budget.map(item => item.categoryId);
    const data = this.budget.map(item => item.amount);
  
    if (this.chart) {
      this.chart.destroy();
    }
  
    this.chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: [
            'rgba(255, 99, 132, 0.2)',
            'rgba(54, 162, 235, 0.2)',
            'rgba(255, 206, 86, 0.2)',
            'rgba(75, 192, 192, 0.2)',
            'rgba(153, 102, 255, 0.2)',
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top'
          },
          title:{
            display: true,
            text: "Presupuestos actuales"
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                let label = context.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed !== null) {
                  label += new Intl.NumberFormat('es-CL', {
                    style: 'currency',
                    currency: 'CLP'
                  }).format(context.parsed);
                }
                return label;
              }
            }
          },
          datalabels: {
            formatter: (value) => {
              return new Intl.NumberFormat('es-CL', {
                style: 'currency',
                currency: 'CLP'
              }).format(value);
            },
            color: '#000',
            anchor: 'center',
            align: 'center',
            font: {
              weight: 'bold'
            }
          }
        }
      },
      plugins: [ChartDataLabels] // Add this line
    });
  }

  async saveBudget(){
    if(!this.monto || !this.categoriaSeleccionada){
      toast.error("¡¡ Todos los campos son requeridos !!");
      return;
    }

    if (this.monto > this.saldo){
      toast.error("¡No puedes crear un presupuesto mayor a tu saldo!")
      return;
    }

    let estaRepitido = this.budget.filter(item => this.categoriaSeleccionada === item.categoryId)

    if(estaRepitido.length > 0){
      toast.error("¡No puedes crear un presupuesto que ya está existe!")
      return;
    }

    const budget : Budget = {
    id: new Date().getTime(),
    categoryId: this.categoriaSeleccionada,
    amount: this.monto
    }
    await this._firestore.createBudget(this.uid, budget)
    this.categoriaSeleccionada = '';
    this.montoFormateado = '$0';
    this.monto = 0;
    toast.success("Presupuesto guardado exitosamente")
    this.ionViewWillEnter();
    this.closeModal();
  }

  async deleteBudget(selectedBudget : Budget){
    try{
      await this._firestore.deleteBudget(selectedBudget, this.uid);
      toast.success("Presupuesto eliminado correctamente")
      this.closeModalToDeleteBudget();
      this.ionViewWillEnter();
    }catch(error){
      toast.error("Error al eliminar presupuesto " + error)
      console.log(error);
    }
  }

  async editBudget(selectedBudget : Budget){
    try{
      if(!selectedBudget.amount || !selectedBudget.categoryId){
        toast.error("Debes tener los datos completos")
        return;
      }
      await this._firestore.editBudget(selectedBudget, this.uid);
      this.budgetService.notificarCambio(); 
      toast.success("Presupuesto actualizado correctamente");
      this.closeModalToEditBudget();
      this.ionViewWillEnter();
    } catch (e){
      toast.error("Error al editar")
    }
  }

   async getTipsFinancieros() {
    try {
      if (this.tips.length === 0) {
        this.tips = await this._firestore.getTipsFinancieros();
      }
      
      this.showRandomTip();
      
      // Cambiar tip cada 30 segundos
      this.tipInterval = setInterval(() => {
        this.showRandomTip();
      }, 180000); // 30 segundos
      
    } catch (e) {
      toast.error("Error al obtener los tips");
    }
  }

  private showRandomTip() {
    if (this.tips.length > 0) {
      const randomIndex = Math.floor(Math.random() * this.tips.length);
      this.currentTip = this.tips[randomIndex];
    }
  }

  openModal() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false; 
  }
  openModalToEditBudget(selectedBudget : Budget){
    this.dataBudgetToEdit = selectedBudget;
    this.isModalToEditBudget = true;
  }

  closeModalToEditBudget(){
    this.isModalToEditBudget = false;
  }

  openModalToDeleteBudget(selectedBudget : Budget){
    this.dataBudgetToDelete = selectedBudget;
    this.isModalToDeleteBudget = true;
  }

  closeModalToDeleteBudget(){
    this.isModalToDeleteBudget = false;
    this.dataBudgetToDelete = null!;
  }

  ngOnDestroy() {
    if (this.tipInterval) {
      clearInterval(this.tipInterval);
    }
  }
}
