import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { NgxSonnerToaster } from 'ngx-sonner';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet, NgxSonnerToaster, FormsModule],
})
export class AppComponent {
  constructor() {}
}
