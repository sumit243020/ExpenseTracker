import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ModalController } from '@ionic/angular/lazy';
import { Subscription } from 'rxjs';
import { ExpenseFormPage } from './expense-form/expense-form.page';
import { AuthService } from './services/auth.service';
import { AppStateService } from './services/app-state.service';
import { ShakeService } from './services/shake.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit, OnDestroy {
  ready = false;
  private sub?: Subscription;

  constructor(
    private readonly auth: AuthService,
    private readonly state: AppStateService,
    private readonly shake: ShakeService,
    private readonly modalCtrl: ModalController,
    private readonly router: Router,
  ) {}

  async ngOnInit(): Promise<void> {
    const user = await this.auth.restoreSession();
    this.ready = true;

    if (user) {
      await this.router.navigateByUrl('/tabs/dashboard', { replaceUrl: true });
      await this.shake.start(() => void this.openAddFromShake());
    }

    this.sub = this.state.user$.subscribe((u) => {
      if (u) {
        void this.shake.start(() => void this.openAddFromShake());
      } else {
        this.shake.stop();
      }
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.shake.stop();
  }

  private async openAddFromShake(): Promise<void> {
    if (!this.state.isAuthenticated) return;
    this.state.setEditingExpense(null);
    const top = await this.modalCtrl.getTop();
    if (top) return;
    const modal = await this.modalCtrl.create({
      component: ExpenseFormPage,
      componentProps: { expense: null },
    });
    await modal.present();
  }
}
