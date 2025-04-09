import { Component, inject, OnInit } from '@angular/core';
import { IonLabel, IonItem, IonList, IonContent, IonIcon  } from '@ionic/angular/standalone'
import { AuthService } from 'src/app/shared/services/auth/auth.service';
import { logOutOutline, personOutline, lockClosedOutline, moonOutline, languageOutline, notificationsOutline, mailOutline } from 'ionicons/icons'; 
import { addIcons } from 'ionicons';
import { UtilsService } from 'src/app/shared/utils/utils.service';

@Component({
  selector: 'app-preferences',
  templateUrl: './preferences.component.html',
  styleUrls: ['./preferences.component.scss'],
  imports: [IonLabel, IonItem, IonList, IonContent, IonIcon]
})
export default class PreferencesComponent  implements OnInit {
  private _auth = inject(AuthService);
  private _utils = inject(UtilsService)
  constructor() { 
    addIcons({logOutOutline, personOutline, lockClosedOutline, moonOutline, languageOutline, notificationsOutline, mailOutline});
  }

  ngOnInit() {}

  async signOut(){
    return await this._auth.signOutFirebase();
  }

  navigateTo(path: string) {
    this._utils.navigateToWithoutLoading(path);
  }
}
