import { inject, Injectable } from '@angular/core';
import { NavController, LoadingController } from '@ionic/angular/standalone';

@Injectable({
  providedIn: 'root'
})
export class UtilsService {

  private _navCtrl = inject(NavController);
  loadingCtrl = inject(LoadingController);

  loadingSpinner(){
    return this.loadingCtrl.create({
      // message: 'Cargando...',
      spinner: 'crescent'
    });
  }

  async navigateTo(path: string) {
    const loading = await this.loadingCtrl.create({
      message: 'Redirigiendo...',
      spinner: 'crescent'
    });
    await loading.present();
    setTimeout(async () => {
      this._navCtrl.navigateRoot(path);
      setTimeout(() => {
        loading.dismiss();
      }, 500); 
    }, 1000);
  }

  async navigateToWithoutLoading(path: string){
    this._navCtrl.navigateRoot(path);
  }  
}
