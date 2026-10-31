import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-wrapper">
      <div class="login-card">
        <div class="brand">
          <div class="badge">OC</div>
          <h2>OrderCraft</h2>
          <p>Manufacturing Order Management System</p>
        </div>

        <div class="auth-tabs">
          <button 
            type="button" 
            class="tab-btn" 
            [class.active]="activeTab === 'login'"
            (click)="switchTab('login')">
            Sign In
          </button>
          <button 
            type="button" 
            class="tab-btn" 
            [class.active]="activeTab === 'register'"
            (click)="switchTab('register')">
            Create Account
          </button>
        </div>

        @if (errorMessage) {
          <div class="alert alert-danger">{{ errorMessage }}</div>
        }
        @if (successMessage) {
          <div class="alert alert-success">{{ successMessage }}</div>
        }

        @if (activeTab === 'login') {
          <form (ngSubmit)="onLogin()">
            <div class="form-group">
              <label for="username">Username</label>
              <input
                type="text"
                id="username"
                [(ngModel)]="username"
                name="username"
                placeholder="Enter your username"
                required
              />
            </div>

            <div class="form-group">
              <label for="password">Password</label>
              <input
                type="password"
                id="password"
                [(ngModel)]="password"
                name="password"
                placeholder="••••••••"
                required
              />
            </div>

            <button type="submit" class="btn btn-primary w-100" [disabled]="loading">
              {{ loading ? 'Signing in...' : 'Sign In to OrderCraft' }}
            </button>
          </form>
        } @else {
          <form (ngSubmit)="onRegister()">
            <div class="form-group">
              <label for="regFullName">Full Name</label>
              <input
                type="text"
                id="regFullName"
                [(ngModel)]="regFullName"
                name="regFullName"
                placeholder="e.g. Ramesh Kumar"
                required
              />
            </div>

            <div class="form-group">
              <label for="regEmail">Work Email</label>
              <input
                type="email"
                id="regEmail"
                [(ngModel)]="regEmail"
                name="regEmail"
                placeholder="ramesh@manufacturing.in"
                required
              />
            </div>

            <div class="form-group">
              <label for="regUsername">Choose Username</label>
              <input
                type="text"
                id="regUsername"
                [(ngModel)]="regUsername"
                name="regUsername"
                placeholder="ramesh_k"
                required
              />
            </div>

            <div class="form-group">
              <label for="regPassword">Password</label>
              <input
                type="password"
                id="regPassword"
                [(ngModel)]="regPassword"
                name="regPassword"
                placeholder="At least 6 characters"
                required
              />
            </div>

            <div class="form-group">
              <label for="regRole">Role</label>
              <select id="regRole" [(ngModel)]="regRole" name="regRole">
                <option value="ROLE_STAFF">Plant Operations / Supervisor (Staff)</option>
                <option value="ROLE_ADMIN">Managing Director / Plant Head (Admin)</option>
              </select>
            </div>

            <button type="submit" class="btn btn-primary w-100" [disabled]="loading">
              {{ loading ? 'Creating Account...' : 'Create My Account' }}
            </button>
          </form>
        }
      </div>
    </div>
  `,
  styles: [`
    .login-wrapper {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      padding: 20px;
    }

    .login-card {
      background: #ffffff;
      width: 100%;
      max-width: 440px;
      padding: 36px;
      border-radius: 16px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);

      .brand {
        text-align: center;
        margin-bottom: 24px;

        .badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 8px 16px;
          background: #2563eb;
          color: white;
          font-weight: 800;
          font-size: 16px;
          border-radius: 10px;
          margin-bottom: 12px;
        }

        h2 {
          font-size: 24px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.5px;
        }

        p {
          font-size: 13px;
          color: #64748b;
          margin-top: 4px;
        }
      }

      .auth-tabs {
        display: flex;
        gap: 8px;
        background: #f1f5f9;
        padding: 4px;
        border-radius: 10px;
        margin-bottom: 20px;

        .tab-btn {
          flex: 1;
          padding: 9px 12px;
          border: none;
          background: transparent;
          font-size: 13px;
          font-weight: 600;
          color: #64748b;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;

          &.active {
            background: #ffffff;
            color: #0f172a;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
        }
      }

      .alert {
        padding: 10px 14px;
        border-radius: 8px;
        font-size: 13px;
        margin-bottom: 18px;
        &.alert-danger {
          background-color: #fee2e2;
          color: #991b1b;
          border: 1px solid #fecaca;
        }
        &.alert-success {
          background-color: #dcfce7;
          color: #166534;
          border: 1px solid #bbf7d0;
        }
      }

      .form-group {
        margin-bottom: 16px;

        label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #334155;
          margin-bottom: 6px;
        }

        input, select {
          width: 100%;
          padding: 10px 14px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 14px;
          outline: none;
          box-sizing: border-box;

          &:focus {
            border-color: #2563eb;
            box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
          }
        }
      }

      .w-100 {
        width: 100%;
        padding: 12px;
        font-size: 14px;
        font-weight: 600;
        border-radius: 8px;
        margin-top: 6px;
      }
    }
  `]
})
export class LoginComponent {
  activeTab: 'login' | 'register' = 'login';
  
  // Login
  username = '';
  password = '';
  
  // Register
  regFullName = '';
  regEmail = '';
  regUsername = '';
  regPassword = '';
  regRole: 'ROLE_STAFF' | 'ROLE_ADMIN' = 'ROLE_STAFF';

  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(private authService: AuthService, private router: Router) {}

  switchTab(tab: 'login' | 'register'): void {
    this.activeTab = tab;
    this.errorMessage = '';
    this.successMessage = '';
  }

  onLogin(): void {
    if (!this.username.trim() || !this.password) {
      this.errorMessage = 'Please enter both username and password';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.login({ username: this.username.trim(), password: this.password }).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Invalid username or password';
      }
    });
  }

  onRegister(): void {
    if (!this.regFullName.trim() || !this.regEmail.trim() || !this.regUsername.trim() || !this.regPassword) {
      this.errorMessage = 'Please fill out all registration fields';
      return;
    }

    if (this.regPassword.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.register({
      fullName: this.regFullName.trim(),
      email: this.regEmail.trim(),
      username: this.regUsername.trim(),
      password: this.regPassword,
      role: this.regRole
    }).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Registration failed. Username may already exist.';
      }
    });
  }
}
