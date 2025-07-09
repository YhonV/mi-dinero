import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { NgxSonnerToaster } from 'ngx-sonner';
import { FormsModule } from '@angular/forms';
import { UserService } from './shared/services/user/user.service';
import { UtilsService } from './shared/utils/utils.service';
import { SplashScreen } from '@capacitor/splash-screen';


@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet, NgxSonnerToaster, FormsModule],
})
export class AppComponent implements OnInit {
  private authPromise: Promise<void>;

  constructor(private _utils: UtilsService, private userService: UserService) {
    this.showSplash()
    this.authPromise = this.initializeAuth();
  }

  async showSplash(){
    await SplashScreen.show({
      autoHide: true,
      showDuration: 3000
    });
  }

  async ngOnInit() {
    try {
      
      await this.waitForAuth();
      
      if (this.userService.isAuthenticated()) {
        this._utils.navigateToWithoutLoading("/home");
      } else {
        this._utils.navigateToWithoutLoading("/auth/sign-in");
      }
    } catch (e) {
      console.log('❌ Error in ngOnInit:', e);
      alert('Error: ' + JSON.stringify(e));
    }
  }

  private async initializeAuth(): Promise<void> {
    // Aquí deberías inicializar Firebase Auth
    // Por ejemplo: return this.userService.initializeAuth();
    return new Promise<void>((resolve) => {
      // Simular inicialización de auth
      setTimeout(() => resolve(), 1000);
    });
  }

  private async waitForAuth(): Promise<void> {
    return Promise.race([
      this.authPromise,
      new Promise<void>((resolve) => {
        setTimeout(() => {
          console.log('⏰ Auth timeout, proceeding anyway');
          resolve();
        }, 3000); // 3 segundos máximo
      })
    ]);
  }
}