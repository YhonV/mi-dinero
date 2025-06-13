import { Component, OnInit, inject, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { IonContent, IonCardContent, IonSpinner, IonCard, IonSegment, IonSegmentButton, IonLabel, IonIcon } from '@ionic/angular/standalone'
import { FirestoreService } from 'src/app/shared/services/firestore/firestore.service';
import { Category, User } from 'src/app/shared/models/interfaces';
import { Auth } from '@angular/fire/auth';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import { addIcons } from 'ionicons';
import { downloadOutline, shareSocialOutline } from 'ionicons/icons';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Subject } from 'rxjs';
import { Filesystem, Directory, Encoding, PermissionStatus } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { toast } from 'ngx-sonner';

// Register all Chart.js components
Chart.register(...registerables, ChartDataLabels);

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  imports: [IonContent, CommonModule, FormsModule, IonCardContent, IonSpinner, IonCard, IonSegment, IonSegmentButton, IonLabel, IonIcon]
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
      downloadOutline,
      shareSocialOutline
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
    const labels = fechas.map(fecha => {
      const d = new Date(fecha + 'T00:00:00'); // Interpreta como 00:00:00 en la zona horaria local
      // También puedes probar new Date(fecha + 'T00:00:00-04:00') si siempre es GMT-4 (no recomendado por cambios de horario de verano)
      return d.toLocaleDateString('es-CL', { day: 'numeric', month: 'long' });
    });

    // const labels = fechas.map(fecha => new Date(fecha).toLocaleDateString('es-CL', { day: 'numeric', month: 'long' }));

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

  async generarPdf1(): Promise<{ base64Data: string, fileName: string } | null> {

    const { desde, hoy } = this.getPeriodoDates();
    const periodText = `Del ${desde.toLocaleDateString()} al ${hoy.toLocaleDateString()}`;


    await new Promise(resolve => setTimeout(resolve, 100));

    if (!this.gastosCanvas?.nativeElement || !this.ingresosCanvas?.nativeElement || !this.resumenCanvas?.nativeElement) {
      throw new Error('Uno o más canvases de los gráficos para PDF no están disponibles en el DOM.');
    }

    const gastosData = await this._firestore.getGastosAgrupados(this.uid, desde, hoy);
    const ingresosData = await this._firestore.getIngresosAgrupados(this.uid, desde, hoy);

    this.cargarGrafico(this.gastosCanvas.nativeElement, gastosData.porCategoria, 'Gastos por Categoría', periodText, 'gastos');
    this.cargarGrafico(this.ingresosCanvas.nativeElement, ingresosData.porCategoria, 'Ingresos por Categoría', periodText, 'ingresos');
    this.cargarGraficoComparativo(this.resumenCanvas.nativeElement, gastosData.porFecha, ingresosData.porFecha, 'Ingresos VS. Gastos', periodText);

    await new Promise(resolve => setTimeout(resolve, 500)); // A slightly longer delay for capture

    const doc = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 190;
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    let currentY = 10;

    const addImageToPdf = async (canvas: HTMLCanvasElement, mainTitle: string, periodSubtitle: string) => {
      const marginX = 15;
      const centeredX = pageWidth / 2
      const estimatedTitleHeight = 25;
      const estimatedImageHeight = (canvas.height * imgWidth) / canvas.width;

      if (currentY + estimatedTitleHeight + estimatedImageHeight + 20 > pageHeight) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(0, 0, 0);
      doc.text(mainTitle, centeredX, currentY, { align: 'center' });

      currentY += 8;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.setTextColor(50, 50, 50);
      doc.text(periodSubtitle, centeredX, currentY, { align: 'center' });

      currentY += 15;

      const canvasImg = await html2canvas(canvas, { scale: 2 });
      const imgData = canvasImg.toDataURL('image/png');
      const imgHeight = (canvasImg.height * imgWidth) / canvasImg.width;

      doc.addImage(imgData, 'PNG', (pageWidth - imgWidth) / 2, currentY, imgWidth, imgHeight);
      currentY += imgHeight + 10;
    };

    try {
      await addImageToPdf(this.gastosCanvas.nativeElement, 'Reporte Financiero: Gastos', periodText);
      await addImageToPdf(this.ingresosCanvas.nativeElement, 'Reporte Financiero: Ingresos', periodText);
      await addImageToPdf(this.resumenCanvas.nativeElement, 'Reporte Financiero: Comparativo', periodText);
    } catch (chartGenError) {
      console.error('Error al generar imágenes de los gráficos:', chartGenError);
      return null;
    }

    const base64WithPrefix = doc.output('datauristring');
    const base64Data = base64WithPrefix.split(',')[1];
    const fileName = `reporte_financiero_${this.periodo}_${new Date().toLocaleDateString('es-CL').replace(/\//g, '-')}.pdf`;

    return { base64Data, fileName }
  }

  async generarPdf(): Promise<{ base64Data: string, fileName: string } | null> {

    const { desde, hoy } = this.getPeriodoDates();
    const periodText = `${desde.toLocaleDateString()} al ${hoy.toLocaleDateString()}`;


    await new Promise(resolve => setTimeout(resolve, 100));

    if (!this.gastosCanvas?.nativeElement || !this.ingresosCanvas?.nativeElement || !this.resumenCanvas?.nativeElement) {
      throw new Error('Uno o más canvases de los gráficos para PDF no están disponibles en el DOM.');
    }

    const gastosData = await this._firestore.getGastosAgrupados(this.uid, desde, hoy);
    const ingresosData = await this._firestore.getIngresosAgrupados(this.uid, desde, hoy);

    this.cargarGrafico(this.gastosCanvas.nativeElement, gastosData.porCategoria, 'Gastos por Categoría', periodText, 'gastos');
    this.cargarGrafico(this.ingresosCanvas.nativeElement, ingresosData.porCategoria, 'Ingresos por Categoría', periodText, 'ingresos');
    this.cargarGraficoComparativo(this.resumenCanvas.nativeElement, gastosData.porFecha, ingresosData.porFecha, 'Ingresos VS. Gastos', periodText);

    await new Promise(resolve => setTimeout(resolve, 500)); // A slightly longer delay for capture

    const doc = new jsPDF('p', 'mm', 'a4');
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 10;
    let currentY = margin + 10;

    // Título
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(0, 0, 100); // Azul oscuro
    doc.text(`Reporte Financiero`, pageWidth / 2, currentY, { align: 'center' });
    currentY += 10; // Espacio después del título principal

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50); // Gris
    doc.text(`Generado el: ${new Date().toLocaleDateString('es-CL')} -  Comprende movimientos entre las fechas: ${periodText}`, pageWidth / 2, currentY, { align: 'center' });

    // Introducción
    currentY += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(30, 30, 30);
    const introText = `Este reporte proporciona un análisis detallado de sus ingresos y gastos para el período seleccionado, permitiéndole identificar tendencias y tomar decisiones informadas.`;
    const splitIntroText = doc.splitTextToSize(introText, pageWidth - (margin * 2));
    doc.text(splitIntroText, margin, currentY);
    currentY += splitIntroText.length * 5;
    currentY += 15;

    // Gráficos
    const chartAreaWidth = pageWidth - (margin * 2);
    const chartSpacing = 5;
    const halfChartWidth = (chartAreaWidth - chartSpacing) / 2 //Ancho de cada gráfico

    const gastosCanvasImg = await html2canvas(this.gastosCanvas.nativeElement, { scale: 2 });
    const ingresosCanvasImg = await html2canvas(this.ingresosCanvas.nativeElement, { scale: 2 });
    
    const gastosImgData = gastosCanvasImg.toDataURL('image/png');
    const ingresosImgData = ingresosCanvasImg.toDataURL('image/png');

    const gastosImgHeight = (gastosCanvasImg.height * halfChartWidth) / gastosCanvasImg.width;
    const ingresosImgHeight = (ingresosCanvasImg.height * halfChartWidth) / ingresosCanvasImg.width;

    const maxGraficoAltura = Math.max(gastosImgHeight, ingresosImgHeight);

    // // Subtítulos de gráficos
    // doc.setFont('helvetica', 'bold');
    // doc.setFontSize(14);
    // doc.setTextColor(0,0,0);

    // doc.text('Gastos por Categoría', margin + (halfChartWidth / 2), currentY, { align: 'center'});
    // doc.text('Ingresos por Categoría', margin + halfChartWidth + chartSpacing + (halfChartWidth / 2), currentY, {align: 'center'});
    // currentY += 8;

    // Añadir imágenes
    doc.addImage(ingresosImgData, 'PNG', margin, currentY, halfChartWidth, ingresosImgHeight);
    doc.addImage(gastosImgData, 'PNG', margin + halfChartWidth + chartSpacing, currentY, halfChartWidth, ingresosImgHeight);
    currentY += maxGraficoAltura + 15;

    //Gráfico Comparativo
    // doc.setFont('helvetica', 'bold');
    // doc.setFontSize(16);
    // doc.setTextColor(0,0,0);
    // doc.text('Ingresos vs. Gastos', pageWidth / 2, currentY, {align: 'center'});
    // currentY += 8;

    const resumenCanvasImg = await html2canvas(this.resumenCanvas.nativeElement, {scale: 2});
    const resumenImgData = resumenCanvasImg.toDataURL('image/png');
    const resumenImgWidth = pageWidth - (margin * 2);
    const resumenImgHeight = (resumenCanvasImg.height * resumenImgWidth) / resumenCanvasImg.width;

    doc.addImage(resumenImgData, 'PNG', margin, currentY, resumenImgWidth, resumenImgHeight);
    currentY += resumenImgHeight + 15;

    // Notas finales
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(50,50,50);
    const conclusion = `Este reporte es generado automáticamente y se basa en los datos registrados en la aplicación hasta la fecha.`;
    const splitConclusion = doc.splitTextToSize(conclusion, pageWidth - (margin * 2));
    doc.text(splitConclusion, margin, currentY);

    const base64WithPrefix = doc.output('datauristring');
    const base64Data = base64WithPrefix.split(',')[1];
    const fileName = `reporte_financiero_${this.periodo}_${new Date().toLocaleDateString('es-CL').replace(/\//g, '-')}.pdf`;

    return { base64Data, fileName }
  }


  async compartirPdf() {
    if (!this.uid) {
      console.warn('UID no disponible para compartir el reporte PDF.');
      return;
    }

    this.exportPDFLoading = true;
    try {
      const pdfResult = await this.generarPdf();
      if (!pdfResult || !pdfResult.base64Data || !pdfResult.fileName) {
        toast.error('❌ Error al generar los datos del reporte.')
        return;
      }
      const { base64Data, fileName } = pdfResult;
      const tempPath = fileName;
      await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Cache, // Esto apunta al directorio de descargas visible por el usuario
        recursive: true // Crea directorios si no existen
      });
      console.log('Reporte guardado temporalmente en caché:', tempPath);

      await Share.share({
        title: 'Compartir Reporte PDF',
        text: 'Mira mi reporte financiero',
        url: (await Filesystem.getUri({ directory: Directory.Cache, path: fileName })).uri, // Obtener la URI completa del archivo en caché
        dialogTitle: 'Compartir Reporte',
        // files: [{ path: tempFilePath }] // Si Share.share() tuviera una propiedad 'files', pero 'url' suele ser el camino para archivos.
      });

      console.log('Reporte listo para compartir');
      toast.success('Reporte listo para compartir');

      setTimeout(async () => {
        await Filesystem.deleteFile({
          path: fileName,
          directory: Directory.Cache
        });
        console.log('Archivo temporal eliminado.');
      }, 2000);
    } catch (error) {
      console.error('Error al compartir el reporte PDF:', error);
      toast.error('❌ Error al compartir el reporte. Intenta de nuevo.');
    } finally {
      this.exportPDFLoading = false;
      this.destroyCharts();
    }
  }

  async descargarPdf() {
    if (!this.uid) {
      console.warn('UID no disponible para generar el reporte PDF.');
      return;
    }

    this.exportPDFLoading = true;


    try {
      const pdfResult = await this.generarPdf();
      if (!pdfResult || !pdfResult.base64Data || !pdfResult.fileName) {
        toast.error('❌ Error al generar los datos del reporte.')
        return;
      }
      const { base64Data, fileName } = pdfResult;

      let status: PermissionStatus = await Filesystem.checkPermissions();
      console.log('Permisos actuales de Filesystem:', status);
      if (status.publicStorage !== 'granted') {
        console.log('Permiso de publicStorage no concedido. Solicitando...');
        status = await Filesystem.requestPermissions();
        if (status.publicStorage !== 'granted') {
          console.error('Permiso de almacenamiento no concedido por el usuario.');
          toast.error('❌ Permiso de almacenamiento denegado. No se puede descargar el reporte.');
          return; // No podemos continuar sin el permiso
        }
        console.log('Permiso de publicStorage concedido.');
      }
      await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Documents, // Esto apunta al directorio de descargas visible por el usuario
        recursive: true // Crea directorios si no existen
      });

      console.log('Reporte descargado exitosamente en:', `${Directory.Documents}/${fileName}`);
      toast.success('Reporte descargado exitosamente en la carpeta: Documentos.', {
        duration: 6000
      });


    } catch (error) {
      console.error('Error al descargar el reporte:', error);
      toast.error('❌ Error al descargar el reporte. Intenta de nuevo.');

    } finally {
      this.exportPDFLoading = false;
      this.destroyCharts();
    }
  }

  private destroyCharts() {
    if (this.gastosChartPDF) this.gastosChartPDF.destroy();
    if (this.ingresosChartPDF) this.ingresosChartPDF.destroy();
    if (this.resumenChartPDF) this.resumenChartPDF.destroy();
    this.gastosChartPDF = null;
    this.ingresosChartPDF = null;
    this.resumenChartPDF = null;
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