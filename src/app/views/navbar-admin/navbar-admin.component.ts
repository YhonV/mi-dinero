import { Component, OnInit } from '@angular/core';
import { addIcons } from 'ionicons';
import { IonTabBar, IonTabButton, IonIcon, IonLabel, IonRouterOutlet, IonTabs } from '@ionic/angular/standalone';
import { home, settingsOutline } from 'ionicons/icons';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar-admin',
  templateUrl: './navbar-admin.component.html',
  styleUrls: ['./navbar-admin.component.scss'],
  imports: [CommonModule, IonIcon, IonRouterOutlet, IonLabel, IonTabButton, IonTabBar, IonTabs,]
})
export class NavbarAdminComponent  implements OnInit {

  constructor() {
    addIcons({ home, settingsOutline });
   }

  ngOnInit() {}

}
  