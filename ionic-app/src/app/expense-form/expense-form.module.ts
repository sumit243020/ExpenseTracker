import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular/lazy';
import { ExpenseFormPage } from './expense-form.page';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule],
  declarations: [ExpenseFormPage],
  exports: [ExpenseFormPage],
})
export class ExpenseFormModule {}
