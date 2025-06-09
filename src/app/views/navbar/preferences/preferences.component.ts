import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonLabel, IonItem, IonContent, IonIcon, IonButton  } from '@ionic/angular/standalone'
import { AuthService } from 'src/app/shared/services/auth/auth.service';
import { logOutOutline, personOutline, lockClosedOutline, moonOutline, languageOutline, notificationsOutline, mailOutline } from 'ionicons/icons'; 
import { addIcons } from 'ionicons';
import { UtilsService } from 'src/app/shared/utils/utils.service';

@Component({
  selector: 'app-preferences',
  templateUrl: './preferences.component.html',
  styleUrls: ['./preferences.component.scss'],
  imports: [IonLabel, IonItem, IonContent, IonIcon, IonButton, FormsModule ]
})
export default class PreferencesComponent  implements OnInit {
  private _auth = inject(AuthService);
  private _utils = inject(UtilsService)

  constructor() { 
    addIcons({logOutOutline, personOutline, lockClosedOutline, moonOutline, languageOutline, notificationsOutline, mailOutline});
  }

  ngOnInit() {}

  async signOut(){
    sessionStorage.removeItem("userData");
    return await this._auth.signOutFirebase();
  }

  navigateTo(path: string) {
    this._utils.navigateToWithoutLoading(path);
  }
}
