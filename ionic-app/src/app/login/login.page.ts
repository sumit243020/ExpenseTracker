import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, LoadingController } from '@ionic/angular/lazy';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false,
})
export class LoginPage {
  email = '';
  name = '';
  loading = false;

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly loadingCtrl: LoadingController,
    private readonly alertCtrl: AlertController,
  ) {}

  async continue(): Promise<void> {
    if (!this.auth.isValidEmail(this.email)) {
      const alert = await this.alertCtrl.create({
        header: 'Invalid email',
        message: 'Please enter a valid email address.',
        buttons: ['OK'],
      });
      await alert.present();
      return;
    }

    this.loading = true;
    const loader = await this.loadingCtrl.create({ message: 'Signing in…' });
    await loader.present();
    try {
      await this.auth.login(this.email, this.name);
      await this.router.navigateByUrl('/tabs/dashboard', { replaceUrl: true });
    } catch (e) {
      const alert = await this.alertCtrl.create({
        header: 'Login failed',
        message: e instanceof Error ? e.message : 'Could not sign in',
        buttons: ['OK'],
      });
      await alert.present();
    } finally {
      this.loading = false;
      await loader.dismiss();
    }
  }
}
