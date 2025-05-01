import { Component, OnInit } from '@angular/core';
import { addIcons } from 'ionicons';
import { IonTabBar, IonTabButton, IonIcon, IonLabel, IonRouterOutlet, IonTabs } from '@ionic/angular/standalone';
import { home, statsChartOutline, settingsOutline, walletOutline } from 'ionicons/icons';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  imports: [IonTabBar, IonTabButton, IonIcon, IonLabel, IonRouterOutlet, IonTabs],
})
export default class NavbarComponent  implements OnInit {

  constructor() {
    addIcons({ home, statsChartOutline, settingsOutline, walletOutline });
   }

   ngOnInit(){}

}
  