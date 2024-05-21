/* eslint-disable no-underscore-dangle */
import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, from, map, tap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { User } from './user.model';
import { Plugins } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';


export interface AutheResponseData{
  idToken: string;
  email: string;
  refreshToken: string;
  expiresIn: string;
  localId: string;
  registered? : boolean
}

@Injectable({
  providedIn: 'root'
})
export class AuthService implements OnDestroy{

  private activeLogoutTimer: any;
  private _user = new BehaviorSubject<User>(null);

  constructor(private http: HttpClient) { }
  

  autoLogin(){
    // return from(Plugins.Storage.get({key: 'authData'})).pipe(
    //   map(storedData => {
    //     if(!storedData || !storedData.value){
    //       return null;
    //     }
    //   })
    // );

    return from(Preferences.get({key: 'authData'})).pipe(
      map(storedData => {
        if(!storedData  || !storedData.value){
          return null;
        }
        const parsedData = JSON.parse(storedData.value) as {token: string, tokenExprationDate: string, userId: string, email: string};

        const expirationTime = new Date(parsedData.tokenExprationDate);
        if(expirationTime <= new Date()){
          return null;
        }

        const user = new User(parsedData.userId,parsedData.email,parsedData.token, expirationTime);

        return user;
      }),
      tap(user => {
        if(user){
          this._user.next(user);
          this.autoLogout(user.tokenDuration);
        }
      }),
      map(user => {
        return !!user;
      })
    )
  }
  get userIsAuthenticated() {
    return this._user.asObservable().pipe(map(user => {
      if(user){
        console.log(!!user.token);
        return !!user.token;
      }else{
        return false;
      }
    }));
  }

  get userId() {
    return this._user.asObservable().pipe(map(user => {
      if(user){
        return user.id;
      }else{
        return null;
      }
    }));
  }

  get token(){
    return this._user.asObservable().pipe(map(user => {
      if(user){
        return user.token;
      }else{
        return null;
      }
    }));
  }

  signup(email: string, password: string){
    return this.http.post<AutheResponseData>(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${environment.firebaseApiKey}`,
    {email: email, password: password, returnSecureToken: true})
    .pipe(tap(this.setUserData.bind(this)));
  }

  login(email: string, password: string) {
    //this._userIsAuthenticated = true;
    return this.http.post<AutheResponseData>(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${environment.firebaseApiKey}`,
    {email: email, password: password, returnSecureToken: true})
    .pipe(tap(this.setUserData.bind(this)));
  }

  private autoLogout(duration: number){
    if(this.activeLogoutTimer){
      clearTimeout(this.activeLogoutTimer);
    }
    this.activeLogoutTimer = setTimeout(() => {
      this.logout();
    }, duration);
  }

  logout() {
    if(this.activeLogoutTimer){
      clearTimeout(this.activeLogoutTimer);
    }
    this._user.next(null);
    Preferences.remove({key: 'authData'});
  }

  ngOnDestroy(): void {
    if(this.activeLogoutTimer){
      clearTimeout(this.activeLogoutTimer);
    }
  }

  private setUserData(userData: AutheResponseData){
    const expirationTime = new Date(new Date().getTime() + +userData.expiresIn * 1000);
    const user = new User(userData.localId,userData.email,userData.idToken, expirationTime)
    this._user.next(user);
    this.autoLogout(user.tokenDuration);

    this.storeAuthData(userData.localId,userData.idToken, expirationTime.toISOString(), userData.email);
  }

  private storeAuthData(userId: string, token: string, tokenExprationTime: string, email: string){
    const data =JSON.stringify({userId: userId, token: token, tokenExprationDate: tokenExprationTime, email: email});
    //Plugins.Storage.set({key: 'authData', value: data});
    Preferences.set({key: 'authData', value: data});
  }
}
