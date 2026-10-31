import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastComponent } from '../toast/toast.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, ToastComponent],
  template: `
    <app-toast></app-toast>
    <div class="app-container">
      <!-- Sidebar Navigation -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <div class="logo-badge">OC</div>
          <div class="brand-title">OrderCraft</div>
        </div>

        <ul class="nav-list">
          <div class="nav-section-title">Operations</div>
          <li class="nav-item">
            <a routerLink="/dashboard" routerLinkActive="active">
              <span class="icon">📊</span>
              <span>Dashboard</span>
            </a>
          </li>

          <div class="nav-section-title">Commercial & Sales</div>
          <li class="nav-item">
            <a routerLink="/orders" routerLinkActive="active">
              <span class="icon">🛒</span>
              <span>Sales Orders</span>
            </a>
          </li>
          <li class="nav-item">
            <a routerLink="/customers" routerLinkActive="active">
              <span class="icon">👥</span>
              <span>Customers</span>
            </a>
          </li>

          <div class="nav-section-title">Shop Floor & Engineering</div>
          <li class="nav-item">
            <a routerLink="/manufacturing" routerLinkActive="active">
              <span class="icon">⚙️</span>
              <span>Production Jobs</span>
            </a>
          </li>
          <li class="nav-item">
            <a routerLink="/products" routerLinkActive="active">
              <span class="icon">📦</span>
              <span>Products & BOM</span>
            </a>
          </li>

          <div class="nav-section-title">Supply Chain</div>
          <li class="nav-item">
            <a routerLink="/raw-materials" routerLinkActive="active">
              <span class="icon">🧱</span>
              <span>Raw Materials</span>
            </a>
          </li>
          <li class="nav-item">
            <a routerLink="/purchase-orders" routerLinkActive="active">
              <span class="icon">🚚</span>
              <span>Purchase Orders</span>
            </a>
          </li>
          <li class="nav-item">
            <a routerLink="/suppliers" routerLinkActive="active">
              <span class="icon">🏭</span>
              <span>Suppliers</span>
            </a>
          </li>

          <div class="nav-section-title">Finance & Intelligence</div>
          <li class="nav-item">
            <a routerLink="/invoices" routerLinkActive="active">
              <span class="icon">📑</span>
              <span>Invoices</span>
            </a>
          </li>
          <li class="nav-item">
            <a routerLink="/payments" routerLinkActive="active">
              <span class="icon">💳</span>
              <span>Payments</span>
            </a>
          </li>
          <li class="nav-item">
            <a routerLink="/reports" routerLinkActive="active">
              <span class="icon">📈</span>
              <span>Reports & CSV</span>
            </a>
          </li>
        </ul>

        <div class="sidebar-footer">
          <div class="user-info">
            <div class="name">{{ authService.currentUser()?.fullName }}</div>
            <div class="role">{{ authService.currentUser()?.role === 'ROLE_ADMIN' ? 'Administrator' : 'Staff' }}</div>
          </div>
          <button class="logout-btn" (click)="onLogout()" title="Sign Out">Sign out</button>
        </div>
      </aside>

      <!-- Main Layout -->
      <div class="main-wrapper">
        <header class="topbar">
          <div class="page-title">Enterprise Manufacturing ERP</div>
          <div class="topbar-actions">
            <span class="status-pill">● System Online & Synchronized</span>
          </div>
        </header>

        <main class="content-body">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `
})
export class MainLayoutComponent {
  constructor(public authService: AuthService) {}

  onLogout(): void {
    this.authService.logout();
  }
}
