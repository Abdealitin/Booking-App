/* eslint-disable no-trailing-spaces */
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { Platform } from '@ionic/angular';
import { AuthService } from './auth/auth.service';
import { SplashScreen } from '@capacitor/splash-screen';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  private authSub: Subscription;
  private previousAuthState = false;
  private platform: Platform;
  constructor(private authService: AuthService, private router: Router) {
    this.initializeApp();
  }
  ngOnDestroy(): void {
    if(this.authSub){
      this.authSub.unsubscribe();
    }
  }
  ngOnInit(): void {
    this.authSub = this.authService.userIsAuthenticated.subscribe(isAuth => {
      if(!isAuth && this.previousAuthState !== isAuth){
        this.router.navigateByUrl('/auth');
      }
      this.previousAuthState = isAuth;
    });
  }

  initializeApp() {
    // this.platform.ready().then(() => {
    //   if (Capacitor.isPluginAvailable('SplashScreen')) {
    //     SplashScreen.hide();
    //   }
    // });
    console.log('App initialized');
  }

  onLogout() {
    this.authService.logout();
    this.router.navigateByUrl('/auth');
  }
}
