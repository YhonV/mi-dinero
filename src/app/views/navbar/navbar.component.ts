import { Component, OnInit } from '@angular/core';
import { addIcons } from 'ionicons';
import { IonBadge, IonTabBar, IonTabButton, IonIcon, IonLabel, IonRouterOutlet } from '@ionic/angular/standalone';
import { home, statsChartOutline, settingsOutline } from 'ionicons/icons';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  imports: [IonBadge, IonTabBar, IonTabButton, IonIcon, IonLabel, IonRouterOutlet],
})
export default class NavbarComponent  implements OnInit {

  constructor() {
    addIcons({ home, statsChartOutline, settingsOutline });
   }

  ngOnInit() {}

}
  