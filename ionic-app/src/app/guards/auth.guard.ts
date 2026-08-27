import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AppStateService } from '../services/app-state.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(
    private readonly state: AppStateService,
    private readonly router: Router,
  ) {}

  canActivate(): boolean | UrlTree {
    if (this.state.isAuthenticated) return true;
    return this.router.parseUrl('/login');
  }
}

@Injectable({ providedIn: 'root' })
export class GuestGuard implements CanActivate {
  constructor(
    private readonly state: AppStateService,
    private readonly router: Router,
  ) {}

  canActivate(): boolean | UrlTree {
    if (!this.state.isAuthenticated) return true;
    return this.router.parseUrl('/tabs/dashboard');
  }
}
