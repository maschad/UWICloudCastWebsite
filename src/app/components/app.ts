import { Component } from '@angular/core';
import { AuthService } from '../../auth';


@Component({
  selector: 'app',
  styles: [
    require('./app.scss')
  ],
  template: `
    <app-header
      [authenticated]="auth.authenticated"
      (signOut)="signOut()"></app-header>

    <main class="main">
       <div *ngIf="auth.authenticated">
           <ng-sidebar-container>
                <!-- A sidebar -->
                <ng-sidebar [(opened)]="_opened"  [closeOnClickOutside]="true" [showBackdrop]="true" [sidebarClass]="'sidebar-content'" [autoFocus]="false">
                    <div class="g-row top_but">
                        <button routerLink="/reading" class="menu-button fa fa-book">Reading area</button>
                    </div>
                    <div class="g-row">
                        <button routerLink="/practice" class="menu-button fa fa-pencil">Practice</button>
                    </div>
                    <div class="g-row">
                        <button routerLink="/results" class="menu-button fa fa-line-chart">Results</button>
                    </div>
                </ng-sidebar>

                <!-- Hamburger menu -->
                <div class="container barP" (click)="openMenu()">
                    <div class="bar1"></div>
                    <div class="bar2"></div>
                    <div class="bar3"></div>
                </div>
        </ng-sidebar-container>
        </div>
      <router-outlet></router-outlet>
    </main>
  `
})

export class AppComponent {
    //Sidebar
    private _opened: boolean = false;

    constructor(private auth: AuthService) {}



    private openMenu() {
        this._opened = !this._opened;
    }

  signOut(): void {
    this.auth.signOut();
  }
}
