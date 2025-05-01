import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { NgxSonnerToaster } from 'ngx-sonner';
import { FormsModule } from '@angular/forms';
import { NgxChartsModule } from '@swimlane/ngx-charts'
// import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet, NgxSonnerToaster, FormsModule,NgxChartsModule],
})
export class AppComponent {
  constructor() {}

  // saleData = [
  //   { name: "Mobiles", value: 105000 },
  //   { name: "Laptop", value: 55000 },
  //   { name: "AC", value: 15000 },
  //   { name: "Headset", value: 150000 },
  //   { name: "Fridge", value: 20000 }
  // ];

}
