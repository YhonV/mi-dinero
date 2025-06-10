import { Component, OnInit, inject, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { IonContent, IonTitle, IonButtons, IonBackButton, IonToolbar, IonHeader, IonCardContent, IonSpinner, IonCard, IonSegment, IonSegmentButton, IonLabel, IonIcon } from '@ionic/angular/standalone'
import { FirestoreService } from 'src/app/shared/services/firestore/firestore.service';
import { Category, User } from 'src/app/shared/models/interfaces';
import { Auth } from '@angular/fire/auth';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import { addIcons } from 'ionicons';
import { downloadOutline } from 'ionicons/icons';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Subject } from 'rxjs'; // Import Subject

// Register all Chart.js components
Chart.register(...registerables, ChartDataLabels);

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  imports: [IonContent, IonTitle, IonButtons, IonBackButton, IonToolbar, IonHeader, CommonModule, FormsModule, IonCardContent, IonSpinner, IonCard, IonSegment, IonSegmentButton, IonLabel, IonIcon]
})
export default class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  // @ViewChild for the main visible UI canvas
  @ViewChild('chartCanvas', { static: false }) chartCanvas!: ElementRef<HTMLCanvasElement>;

  // @ViewChild for hidden canvases used for PDF generation
  @ViewChild('gastosCanvas', { static: false }) gastosCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('ingresosCanvas', { static: false }) ingresosCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('resumenCanvas', { static: false }) resumenCanvas!: ElementRef<HTMLCanvasElement>;

  private _firestore = inject(FirestoreService);
  private _auth = inject(Auth);

  // Chart instance for the visible UI chart
  chart: Chart | null = null;

  // Chart instances for temporary PDF charts
  private gastosChartPDF: Chart | null = null;
  private ingresosChartPDF: Chart | null = null;
  private resumenChartPDF: Chart | null = null;

  uid: string = '';
  userData: User | null = null;
  periodo = 'semana'; // Default period for initial load
  tipo = 'gastos'; // Default type for initial load
  loading = false;
  categoriasGasto: Category[] = [];
  categoria: string = '';
  categoriaSeleccionada: string = '';
  exportPDFLoading = false;

  // Subject to signal when the UID is ready
  private uidReady$ = new Subject<void>();

  constructor() {
    addIcons({
      downloadOutline
    });
  }

  async ngOnInit() {
    this.categoriasGasto = await this._firestore.getCategoriesGastos();

    // Subscribe to auth state changes to get the UID
    this._auth.onAuthStateChanged(async user => {
      if (user) {
        this.uid = user.uid;
        this.userData = await this._firestore.getUser(user.uid);
        this.uidReady$.next(); // Signal that UID is ready
        this.uidReady$.complete(); // Complete the subject as UID typically doesn't change during session
      } else {
        console.log("No user signed in.");
        this.userData = null;
        // Optionally, handle the case where no user is signed in,
        // perhaps by completing uidReady$ without emitting, or by redirecting.
        this.uidReady$.complete();
      }
    });
  }

  async ngAfterViewInit() {
    // Wait for the UID to be ready before attempting to load the chart
    this.uidReady$.subscribe({
      next: async () => {
        // Add a small delay to ensure Angular has finished rendering the canvas element
        // after `ngAfterViewInit` has fired and UID is ready.
        await new Promise(resolve => setTimeout(resolve, 50));
        await this.graficoPorPeriodo();
      },
      error: (err) => console.error('Error waiting for UID:', err),
      complete: () => console.log('UID readiness check complete.')
    });

    // Fallback if UID was already available before ngAfterViewInit, or if auth state is synchronous for some reason
    // This is less likely to be hit now with the Subject
    if (this.uid && this.chartCanvas) {
      await new Promise(resolve => setTimeout(resolve, 50));
      await this.graficoPorPeriodo();
    }
  }

  // Method to get start and end dates for the selected period
  private getPeriodoDates(): { desde: Date, hoy: Date } {
    let hoy = new Date();
    let desde: Date;

    if (this.periodo === 'semana') {
      desde = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - 7);
    } else if (this.periodo === 'mes') {
      desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      hoy = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0); // Last day of the month
    } else if (this.periodo === 'anio') {
      desde = new Date(hoy.getFullYear(), 0, 1); // January 1st
      hoy = new Date(hoy.getFullYear(), 11, 31); // December 31st
    } else {
      // Default value if 'periodo' doesn't match any option
      desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      hoy = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    }
    return { desde, hoy };
  }

  async graficoPorPeriodo() {
    if (!this.uid) {
      console.warn('UID is not available. Cannot load chart.');
      return;
    }

    this.loading = true;
    const { desde, hoy } = this.getPeriodoDates();

    // Explicit check to ensure the canvas is available before proceeding
    if (!this.chartCanvas || !this.chartCanvas.nativeElement) {
      console.warn('El canvas principal no está disponible. No se puede cargar el gráfico de la UI.');
      this.loading = false;
      return;
    }

    // Destroy existing chart to prevent memory leaks and ghost charts
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }

    if (this.tipo === 'gastos') {
      const gastos = await this._firestore.getGastosAgrupados(this.uid, desde, hoy);
      this.cargarGrafico(this.chartCanvas.nativeElement, gastos.porCategoria, 'Gastos por Categoría', `Del ${desde.toLocaleDateString()} al ${hoy.toLocaleDateString()}`, 'gastos');
    } else if (this.tipo === 'ingresos') {
      const ingresos = await this._firestore.getIngresosAgrupados(this.uid, desde, hoy);
      this.cargarGrafico(this.chartCanvas.nativeElement, ingresos.porCategoria, 'Ingresos por Categoría', `Del ${desde.toLocaleDateString()} al ${hoy.toLocaleDateString()}`, 'ingresos');
    } else if (this.tipo === 'comparativo') {
      const gastos = await this._firestore.getGastosAgrupados(this.uid, desde, hoy);
      const ingresos = await this._firestore.getIngresosAgrupados(this.uid, desde, hoy);
      this.cargarGraficoComparativo(this.chartCanvas.nativeElement, gastos.porFecha, ingresos.porFecha, 'Ingresos VS. Gastos', `Del ${desde.toLocaleDateString()} al ${hoy.toLocaleDateString()}`);
    }
    this.loading = false;
  }

  // --- Functions to get chart configuration (no changes) ---

  private getBarChartConfig(data: { [cat: string]: number }, title: string, subtitle: string, chartDataType: 'gastos' | 'ingresos'): ChartConfiguration {
    const labels = Object.keys(data);
    const valores = Object.values(data);
    return {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: chartDataType === 'gastos' ? 'Gastos (CLP)' : 'Ingresos (CLP)',
          data: valores,
          backgroundColor: [
            'rgba(231, 76, 60, 0.8)', 'rgba(52, 152, 219, 0.8)', 'rgba(46, 204, 113, 0.8)',
            'rgba(155, 89, 182, 0.8)', 'rgba(241, 196, 15, 0.8)', 'rgba(230, 126, 34, 0.8)'
          ],
          borderColor: [
            'rgba(231, 76, 60, 1)', 'rgba(52, 152, 219, 1)', 'rgba(46, 204, 113, 1)',
            'rgba(155, 89, 182, 1)', 'rgba(241, 196, 15, 1)', 'rgba(230, 126, 34, 1)'
          ],
          borderWidth: 1,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          datalabels: {
            color: '#2c3e50',
            anchor: 'end',
            align: 'top',
            font: { weight: 'bold', size: 10 },
            formatter: function (value) { return value.toLocaleString(); }
          },
          title: { display: true, text: title, font: { size: 16, family: 'Roboto, sans-serif' }, color: '#2c3e50' },
          subtitle: { display: true, text: subtitle, padding: { bottom: 40 }, font: { size: 12, family: 'Roboto, sans-serif' }, color: '#2c3e50' },
          legend: { display: false },
          tooltip: {
            backgroundColor: '#ffffff', titleColor: '#2c3e50', bodyColor: '#2c3e50', borderColor: '#dee2e6', borderWidth: 1, cornerRadius: 8,
            callbacks: { label: function (context) { return `${context.parsed.y.toLocaleString()} CLP`; } }
          }
        },
        scales: {
          x: { ticks: { color: '#5a6c7d', font: { size: 10, family: 'Roboto, sans-serif' }, maxRotation: 45, minRotation: 45 }, grid: { display: false } },
          y: {
            beginAtZero: true,
            ticks: { color: '#5a6c7d', font: { size: 10, family: 'Roboto, sans-serif' }, callback: function (value) { return value.toLocaleString(); } },
            grid: { color: '#e9ecef' },
            title: { display: true, text: 'Monto (CLP)', color: '#5a6c7d', font: { size: 12 } }
          }
        },
        layout: { padding: { top: 20, bottom: 20 } }
      }
    };
  }

  private getLineChartConfig(gastos: { [fecha: string]: number }, ingresos: { [fecha: string]: number }, title: string, subtitle: string): ChartConfiguration {
    const fechas = Array.from(new Set([...Object.keys(gastos), ...Object.keys(ingresos)])).sort();
    const gastosData = fechas.map(fecha => gastos[fecha] || 0);
    const ingresosData = fechas.map(fecha => ingresos[fecha] || 0);
    const labels = fechas.map(fecha => new Date(fecha).toLocaleDateString('es-CL', { day: 'numeric', month: 'long' }));

    return {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          { label: 'Gastos', data: gastosData, borderColor: '#e74c3c', backgroundColor: 'rgba(231, 76, 60, 0.1)', tension: 0.4, fill: false, pointBackgroundColor: '#e74c3c', pointBorderColor: '#e74c3c', pointRadius: 4 },
          { label: 'Ingresos', data: ingresosData, borderColor: '#3498db', backgroundColor: 'rgba(52, 152, 219, 0.1)', tension: 0.4, fill: false, pointBackgroundColor: '#3498db', pointBorderColor: '#3498db', pointRadius: 4 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { intersect: false, mode: 'index' },
        plugins: {
          datalabels: { display: false },
          title: { display: true, text: title, font: { size: 16, family: 'Roboto, sans-serif' }, color: '#2c3e50' },
          subtitle: { display: true, text: subtitle, padding: { bottom: 40 }, font: { size: 12, family: 'Roboto, sans-serif' }, color: '#2c3e50' },
          legend: { display: true, position: 'top', labels: { usePointStyle: true, font: { family: 'Roboto, sans-serif' }, color: '#2c3e50' } },
          tooltip: {
            backgroundColor: '#ffffff', titleColor: '#2c3e50', bodyColor: '#2c3e50', borderColor: '#dee2e6', borderWidth: 1, cornerRadius: 8,
            callbacks: { label: function (context) { return `${context.dataset.label}: ${context.parsed.y.toLocaleString()} CLP`; } }
          }
        },
        scales: {
          x: { ticks: { color: '#5a6c7d', font: { size: 10, family: 'Roboto, sans-serif' }, maxRotation: 45, minRotation: 45 }, grid: { color: '#e9ecef' } },
          y: {
            beginAtZero: true,
            ticks: { color: '#5a6c7d', font: { size: 10, family: 'Roboto, sans-serif' }, callback: function (value) { return value.toLocaleString(); } },
            grid: { color: '#e9ecef' },
            title: { display: true, text: 'Monto (CLP)', color: '#5a6c7d', font: { size: 12 } }
          }
        },
        layout: { padding: { top: 20, bottom: 20 } }
      }
    };
  }

  // --- Functions to load charts onto a specific canvas ---

  private cargarGrafico(canvasElement: HTMLCanvasElement, data: { [cat: string]: number }, title: string, subtitle: string, chartDataType: 'gastos' | 'ingresos') {
    // Destroy existing chart associated with this canvas if it exists
    if (canvasElement === this.chartCanvas?.nativeElement && this.chart) {
      this.chart.destroy();
      this.chart = null; // Clear the reference
    } else if (canvasElement === this.gastosCanvas?.nativeElement && this.gastosChartPDF) {
      this.gastosChartPDF.destroy();
      this.gastosChartPDF = null;
    } else if (canvasElement === this.ingresosCanvas?.nativeElement && this.ingresosChartPDF) {
      this.ingresosChartPDF.destroy();
      this.ingresosChartPDF = null;
    }

    const ctx = canvasElement.getContext('2d');
    if (!ctx) {
      console.error('No se pudo obtener el contexto 2D del canvas.');
      return;
    }

    const config = this.getBarChartConfig(data, title, subtitle, chartDataType);

    if (canvasElement === this.chartCanvas?.nativeElement) {
      this.chart = new Chart(ctx, config);
    } else if (canvasElement === this.gastosCanvas?.nativeElement) {
      this.gastosChartPDF = new Chart(ctx, config);
    } else if (canvasElement === this.ingresosCanvas?.nativeElement) {
      this.ingresosChartPDF = new Chart(ctx, config);
    }
  }

  private cargarGraficoComparativo(canvasElement: HTMLCanvasElement, gastos: { [fecha: string]: number }, ingresos: { [fecha: string]: number }, title: string, subtitle: string) {
    // Destroy existing chart associated with this canvas if it exists
    if (canvasElement === this.chartCanvas?.nativeElement && this.chart) {
      this.chart.destroy();
      this.chart = null;
    } else if (canvasElement === this.resumenCanvas?.nativeElement && this.resumenChartPDF) {
      this.resumenChartPDF.destroy();
      this.resumenChartPDF = null;
    }

    const ctx = canvasElement.getContext('2d');
    if (!ctx) {
      console.error('No se pudo obtener el contexto 2D del canvas.');
      return;
    }

    const config = this.getLineChartConfig(gastos, ingresos, title, subtitle);

    if (canvasElement === this.chartCanvas?.nativeElement) {
      this.chart = new Chart(ctx, config);
    } else if (canvasElement === this.resumenCanvas?.nativeElement) {
      this.resumenChartPDF = new Chart(ctx, config);
    }
  }

  // --- UI event handlers ---

  async onPeriodoChange(value: any) {
    this.periodo = value;
    if (this.uid) {
      await new Promise(resolve => setTimeout(resolve, 50)); // Small delay for DOM updates
      await this.graficoPorPeriodo();
    } else {
      console.warn('UID not yet available to update chart on period change.');
    }
  }

  async onTipoChange(value: any) {
    if (!value) return;
    this.tipo = String(value);
    if (this.uid) {
      await new Promise(resolve => setTimeout(resolve, 50)); // Small delay for DOM updates
      await this.graficoPorPeriodo();
    } else {
      console.warn('UID not yet available to update chart on type change.');
    }
  }

  // --- PDF download logic ---

  async downloadPdfReport() {
    if (!this.uid) {
      console.warn('UID no disponible para generar el reporte PDF.');
      return;
    }

    this.exportPDFLoading = true;
    const { desde, hoy } = this.getPeriodoDates();
    const periodText = `Del ${desde.toLocaleDateString()} al ${hoy.toLocaleDateString()}`;

    try {
      // Ensure all canvases are available. Give Angular a moment to render them.
      await new Promise(resolve => setTimeout(resolve, 100));

      if (!this.gastosCanvas?.nativeElement || !this.ingresosCanvas?.nativeElement || !this.resumenCanvas?.nativeElement) {
        throw new Error('Uno o más canvases de los gráficos para PDF no están disponibles en el DOM.');
      }

      // 1. Get all necessary data for the three charts
      const gastosData = await this._firestore.getGastosAgrupados(this.uid, desde, hoy);
      const ingresosData = await this._firestore.getIngresosAgrupados(this.uid, desde, hoy);

      // 2. Render charts on their respective hidden canvases
      this.cargarGrafico(this.gastosCanvas.nativeElement, gastosData.porCategoria, 'Gastos por Categoría', periodText, 'gastos');
      this.cargarGrafico(this.ingresosCanvas.nativeElement, ingresosData.porCategoria, 'Ingresos por Categoría', periodText, 'ingresos');
      this.cargarGraficoComparativo(this.resumenCanvas.nativeElement, gastosData.porFecha, ingresosData.porFecha, 'Ingresos VS. Gastos', periodText);

      // 3. Wait a moment for charts to finish rendering on canvases
      await new Promise(resolve => setTimeout(resolve, 500)); // A slightly longer delay for capture

      const doc = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 190;
      let currentY = 10;

      const addImageToPdf = async (canvas: HTMLCanvasElement, pageTitle: string, pageSubtitle: string) => {
        const canvasImg = await html2canvas(canvas, { scale: 2 });
        const imgData = canvasImg.toDataURL('image/png');
        const imgHeight = (canvasImg.height * imgWidth) / canvasImg.width;

        if (currentY + imgHeight + 20 > doc.internal.pageSize.height) {
          doc.addPage();
          currentY = 10;
        }

        doc.addImage(imgData, 'PNG', 10, currentY, imgWidth, imgHeight);
        currentY += imgHeight + 5;

        doc.setFontSize(16);
        doc.text(pageTitle, 105, currentY + 5, { align: 'center' });
        doc.setFontSize(12);
        doc.text(pageSubtitle, 105, currentY + 10, { align: 'center' });
        currentY += 20;
      };

      await addImageToPdf(this.gastosCanvas.nativeElement, 'Reporte Financiero: Gastos', periodText);
      await addImageToPdf(this.ingresosCanvas.nativeElement, 'Reporte Financiero: Ingresos', periodText);
      await addImageToPdf(this.resumenCanvas.nativeElement, 'Reporte Financiero: Comparativo', periodText);

      doc.save(`Reporte_Financiero_${this.periodo}_${new Date().toLocaleDateString('es-CL').replace(/\//g, '-')}.pdf`);
      await this._firestore.createLog(this.uid, "Reporte descargado", "Dashboard")

    } catch (error) {
      console.error('Error generating PDF report:', error);
      // Implement IonToast or IonAlert here for user feedback
    } finally {
      this.exportPDFLoading = false;
      // Destroy PDF charts to free up memory
      this.gastosChartPDF?.destroy();
      this.ingresosChartPDF?.destroy();
      this.resumenChartPDF?.destroy();
      this.gastosChartPDF = null;
      this.ingresosChartPDF = null;
      this.resumenChartPDF = null;

      
    }
  }

  ngOnDestroy() {
    if (this.chart) {
      this.chart.destroy();
    }
    this.gastosChartPDF?.destroy();
    this.ingresosChartPDF?.destroy();
    this.resumenChartPDF?.destroy();
    this.uidReady$.complete(); // Ensure the subject is completed on destroy
  }
}