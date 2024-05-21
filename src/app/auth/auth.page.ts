import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController, LoadingController } from '@ionic/angular';
import { AuthService, AutheResponseData } from './auth.service';
import { StringFormat } from '@angular/fire/compat/storage/interfaces';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.page.html',
  styleUrls: ['./auth.page.scss'],
})
export class AuthPage implements OnInit {

  isLoading = false;
  isLogin = true;
  constructor(private authService: AuthService, private alert: AlertController, private router: Router, private loadingController: LoadingController) { }

  ngOnInit() {
  }

  authenticate(email: string, password: string) {
    console.log(email, password);
    this.isLoading = true;
    this.loadingController.create({ keyboardClose: true, message: 'Logging in...' })
      .then(loadingEl => {
        loadingEl.present();
        let authObs: Observable<AutheResponseData>;

        if(this.isLogin){
          authObs = this.authService.login(email, password);
        }else{
          authObs = this.authService.signup(email, password);
        }

        authObs.subscribe(res => {
          console.log(res);
          this.isLoading = false;
          loadingEl.dismiss();
          console.log('Redirecting....');
          // this.router.navigateByUrl('/places/tabs/discover');
          this.router.navigate(['/places/tabs/discover']);
        }, errRes => {
          loadingEl.dismiss();
          console.log(errRes);
          const code = errRes.error.error.message;
          let message = 'Couldnt Sign you up, Please try again later!';
          if(code === 'EMAIL_EXISTS'){
            message = 'Email Already Exists!';
          }else if(code === 'EMAIL_NOT_FOUND'){
            message = 'Email Does not exist!';
          }else if(code === 'INVALID_PASSWORD'){
            message = 'Invalid Password!';
          }
          this.showAlert(message);
          this.router.navigateByUrl('/places/tabs/discover');
        });
      });
    
  }

  onSubmit(form: NgForm) {
    if (!form?.valid) {
      return;
    }

    const email = form?.value.email;
    const password = form?.value.password;
   // console.log(email, password);
    this.authenticate(email, password);

    form?.reset();
  }

  onSwitch() {
    this.isLogin = !this.isLogin;
  }

  private showAlert(message: string){
    this.alert.create({header: 'Authentication Failed', message: message, buttons: ['Okay']}).then(alertEl => {
      alertEl.present();
    })
  }
}
