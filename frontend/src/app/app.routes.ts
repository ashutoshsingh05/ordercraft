import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { LoginComponent } from './pages/login/login.component';
import { MainLayoutComponent } from './components/main-layout/main-layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { CustomersComponent } from './pages/customers/customers.component';
import { SuppliersComponent } from './pages/suppliers/suppliers.component';
import { ProductsComponent } from './pages/products/products.component';
import { RawMaterialsComponent } from './pages/raw-materials/raw-materials.component';
import { OrdersComponent } from './pages/orders/orders.component';
import { ManufacturingComponent } from './pages/manufacturing/manufacturing.component';
import { PurchaseOrdersComponent } from './pages/purchase-orders/purchase-orders.component';
import { InvoicesComponent } from './pages/invoices/invoices.component';
import { PaymentsComponent } from './pages/payments/payments.component';
import { ReportsComponent } from './pages/reports/reports.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'customers', component: CustomersComponent },
      { path: 'suppliers', component: SuppliersComponent },
      { path: 'products', component: ProductsComponent },
      { path: 'raw-materials', component: RawMaterialsComponent },
      { path: 'orders', component: OrdersComponent },
      { path: 'manufacturing', component: ManufacturingComponent },
      { path: 'purchase-orders', component: PurchaseOrdersComponent },
      { path: 'invoices', component: InvoicesComponent },
      { path: 'payments', component: PaymentsComponent },
      { path: 'reports', component: ReportsComponent }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
