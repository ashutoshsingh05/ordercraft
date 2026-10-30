import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      @for (toast of notificationService.toasts(); track toast.id) {
        <div class="toast-item" [ngClass]="'toast-' + toast.type">
          <div class="toast-icon">
            @switch (toast.type) {
              @case ('success') { <span>✓</span> }
              @case ('error') { <span>✕</span> }
              @case ('warning') { <span>⚠</span> }
              @default { <span>ℹ</span> }
            }
          </div>
          <div class="toast-content">
            @if (toast.title) {
              <div class="toast-title">{{ toast.title }}</div>
            }
            <div class="toast-message">{{ toast.message }}</div>
          </div>
          <button class="toast-close" (click)="notificationService.dismiss(toast.id)">&times;</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 24px;
      right: 24px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 380px;
      pointer-events: none;
    }

    .toast-item {
      pointer-events: auto;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 14px 16px;
      border-radius: 10px;
      background: #ffffff;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
      border-left: 4px solid;
      animation: slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      font-size: 13px;

      &.toast-success {
        border-left-color: #10b981;
        .toast-icon { color: #10b981; background: #ecfdf5; }
      }
      &.toast-error {
        border-left-color: #ef4444;
        .toast-icon { color: #ef4444; background: #fef2f2; }
      }
      &.toast-warning {
        border-left-color: #f59e0b;
        .toast-icon { color: #f59e0b; background: #fffbeb; }
      }
      &.toast-info {
        border-left-color: #3b82f6;
        .toast-icon { color: #3b82f6; background: #eff6ff; }
      }
    }

    .toast-icon {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 13px;
      flex-shrink: 0;
    }

    .toast-content {
      flex: 1;

      .toast-title {
        font-weight: 700;
        color: #0f172a;
        margin-bottom: 2px;
      }

      .toast-message {
        color: #475569;
        line-height: 1.4;
      }
    }

    .toast-close {
      background: transparent;
      border: none;
      color: #94a3b8;
      font-size: 18px;
      cursor: pointer;
      line-height: 1;
      padding: 0;
      &:hover { color: #0f172a; }
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateX(40px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateX(0) scale(1);
      }
    }
  `]
})
export class ToastComponent {
  constructor(public notificationService: NotificationService) {}
}
