import { Component, OnInit } from '@angular/core';
import { addIcons } from 'ionicons';
import { IonTabBar, IonTabButton, IonIcon, IonLabel, IonRouterOutlet, IonTabs } from '@ionic/angular/standalone';
import { home, statsChartOutline, settingsOutline, walletOutline } from 'ionicons/icons';
import { UserService } from 'src/app/shared/services/user/user.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  imports: [IonTabBar, IonTabButton, IonIcon, IonLabel, IonRouterOutlet, IonTabs, CommonModule],
})
export default class NavbarComponent  implements OnInit {

  isAdmin: boolean = false;
  
  constructor(private userService: UserService) {
    addIcons({ home, statsChartOutline, settingsOutline, walletOutline });
   }

   async ngOnInit() {
    await this.userService.waitForAuth();
    this.isAdmin = this.userService.isAdmin();
  }

}
  