import { Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { IonContent, IonButton, IonIcon, IonItem, IonInput } from '@ionic/angular/standalone'
import { Chart, registerables } from 'chart.js';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import { trendingUpOutline } from 'ionicons/icons'; 
import { Category } from 'src/app/shared/models/interfaces';
import { FirestoreService } from 'src/app/shared/services/firestore/firestore.service';

Chart.register(...registerables);
@Component({
  selector: 'app-budget',
  templateUrl: './budget.component.html',
  styleUrls: ['./budget.component.scss'],
  imports: [IonContent, IonButton, IonIcon, IonItem, IonInput, CommonModule]
})
export default class BudgetComponent  implements OnInit {

  @ViewChild('chartCanvas') private chartCanvas!: ElementRef;
  private chart: Chart | undefined;
  private _firestore = inject(FirestoreService);
  categoriasGasto: Category[] = [];
  isModalOpen: boolean = false;

  constructor() { 
    addIcons({trendingUpOutline})
  }

  async ngOnInit() {
    this.categoriasGasto = await this._firestore.getCategoriesGastos()
  }

  ngAfterViewInit() {
    this.createChart();
  }

  private createChart(): void {
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    
    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio'],
        datasets: [{
          label: 'Presupuesto 2025',
          data: [1200, 1900, 3000, 5000, 2200, 3300],
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

  openModal() {
    this.isModalOpen = true;
  }
  closeModal() {
    this.isModalOpen = false; 
  }

}
