import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: number;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private toastsSignal = signal<ToastMessage[]>([]);
  public toasts = this.toastsSignal.asReadonly();
  private counter = 0;

  show(type: 'success' | 'error' | 'info' | 'warning', message: string, title?: string, duration: number = 4000): void {
    const id = ++this.counter;
    const toast: ToastMessage = { id, type, message, title };
    this.toastsSignal.update(toasts => [...toasts, toast]);

    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }
  }

  success(message: string, title: string = 'Success'): void {
    this.show('success', message, title);
  }

  error(message: string, title: string = 'Action Failed'): void {
    this.show('error', message, title, 5000);
  }

  info(message: string, title: string = 'Notice'): void {
    this.show('info', message, title);
  }

  warning(message: string, title: string = 'Attention Required'): void {
    this.show('warning', message, title);
  }

  dismiss(id: number): void {
    this.toastsSignal.update(toasts => toasts.filter(t => t.id !== id));
  }
}
