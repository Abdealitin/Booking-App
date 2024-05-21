import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanLoad, Route, Router, RouterStateSnapshot, UrlSegment, UrlTree } from '@angular/router';
import { Observable, of, switchMap, take, tap } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanLoad {
  constructor(private authServcice: AuthService, private router: Router){}
  canLoad(route: Route, segments: UrlSegment[]): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree{
    
    return this.authServcice.userIsAuthenticated.pipe(take(1),
    switchMap(isAuthenticated => {
      if(!isAuthenticated){
        return this.authServcice.autoLogin();
      }else{
        return of(isAuthenticated);
      }
    }),
    tap(isAuthenticated => {
      if (!isAuthenticated) {
        //console.log('not a valid user', isAuthenticated)
        this.router.navigateByUrl('/auth');
      }
      
    }));
  }
}
