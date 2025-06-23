import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { NgxSonnerToaster } from 'ngx-sonner';
import { FormsModule } from '@angular/forms';
import { UserService } from './shared/services/user/user.service';
import { UtilsService } from './shared/utils/utils.service';


@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet, NgxSonnerToaster, FormsModule],
})
export class AppComponent implements OnInit{
  constructor(private _utils: UtilsService, private userService: UserService) {}

  async ngOnInit() {
    try{
      await this.userService.waitForAuth()
      if (this.userService.isAuthenticated()) {
          this._utils.navigateToWithoutLoading("/home")
        } else {
           this._utils.navigateToWithoutLoading("/auth/sign-in")
        }
    } catch(e){
      console.log(e)
    }
  }
}
