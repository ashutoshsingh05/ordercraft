import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { NotificationService } from '../../services/notification.service';
import { Payment, Invoice } from '../../models/models';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="toolbar">
        <div>
          <h2>Cash Receipts & Settlement Ledger</h2>
          <p style="color: #64748b; font-size: 13.5px;">Record customer settlements against invoices and reconcile outstanding balances</p>
        </div>
        <div class="actions">
          <input
            type="text"
            class="search-input"
            placeholder="Search payments..."
            [(ngModel)]="searchQuery"
          />
          <button class="btn btn-primary" (click)="openPaymentModal()">+ Record Inbound Payment</button>
        </div>
      </div>

      <div class="card">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Receipt Ref</th>
                <th>Invoice #</th>
                <th>Settlement Date</th>
                <th>Payment Method</th>
                <th>Amount ($)</th>
                <th>Bank / Reference #</th>
                <th>Audit Notes</th>
              </tr>
            </thead>
            <tbody>
              @for (p of filteredPayments(); track p.id) {
                <tr>
                  <td><strong>{{ p.paymentNumber }}</strong></td>
                  <td>{{ p.invoiceNumber }}</td>
                  <td>{{ p.paymentDate }}</td>
                  <td>
                    <span class="badge badge-info">{{ p.paymentMethod }}</span>
                  </td>
                  <td style="color: #10b981; font-weight: 800; font-size: 14px;">₹{{ p.amount | number:'1.2-2' }}</td>
                  <td>{{ p.referenceNumber || '-' }}</td>
                  <td>{{ p.notes || '-' }}</td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="7" style="text-align: center; color: #94a3b8; padding: 24px;">No payments recorded</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Record Payment Modal -->
      @if (showPaymentModal) {
        <div class="modal-overlay">
          <div class="modal-content">
            <div class="modal-header">
              <h3>Record Customer Payment</h3>
              <button class="close-btn" (click)="showPaymentModal = false">&times;</button>
            </div>

            <form (ngSubmit)="savePayment()">
              <div class="form-group">
                <label>Select Unpaid / Partially Paid Invoice *</label>
                <select [(ngModel)]="newPayment.invoiceId" name="inv" (change)="onInvoiceSelected()" required>
                  <option [ngValue]="null" disabled>Choose Invoice...</option>
                  @for (inv of payableInvoices; track inv.id) {
                    <option [value]="inv.id">
                      {{ inv.invoiceNumber }} - {{ inv.customer?.name }} (Balance: ₹{{ inv.outstandingBalance }})
                    </option>
                  }
                </select>
              </div>

              @if (selectedInvoice) {
                <div style="background: #f8fafc; padding: 12px; border-radius: 6px; margin-bottom: 16px; font-size: 13px;">
                  <div>Invoice Total: <strong>₹{{ selectedInvoice.totalAmount }}</strong></div>
                  <div>Outstanding Balance: <strong style="color: #ef4444;">₹{{ selectedInvoice.outstandingBalance }}</strong></div>
                </div>
              }

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                <div class="form-group">
                  <label>Payment Amount (₹) *</label>
                  <input type="number" step="0.01" [(ngModel)]="newPayment.amount" name="amount" required />
                </div>
                <div class="form-group">
                  <label>Payment Date *</label>
                  <input type="date" [(ngModel)]="newPayment.paymentDate" name="pdate" required />
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                <div class="form-group">
                  <label>Payment Method *</label>
                  <select [(ngModel)]="newPayment.paymentMethod" name="method" required>
                    <option value="BANK_TRANSFER">Bank Transfer / Wire</option>
                    <option value="CREDIT_CARD">Credit Card</option>
                    <option value="CHECK">Company Check</option>
                    <option value="CASH">Cash</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Transaction / Check Ref #</label>
                  <input type="text" [(ngModel)]="newPayment.referenceNumber" name="refNum" placeholder="e.g. WIRE-84920" />
                </div>
              </div>

              <div class="form-group">
                <label>Notes</label>
                <input type="text" [(ngModel)]="newPayment.notes" name="notes" placeholder="e.g. Wire received from customer" />
              </div>

              <div class="modal-actions">
                <button type="button" class="btn btn-secondary" (click)="showPaymentModal = false">Cancel</button>
                <button type="submit" class="btn btn-success" [disabled]="!newPayment.invoiceId || newPayment.amount <= 0">
                  Post Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `
})
export class PaymentsComponent implements OnInit {
  payments: Payment[] = [];
  payableInvoices: Invoice[] = [];
  searchQuery = '';

  showPaymentModal = false;
  selectedInvoice: Invoice | null = null;
  newPayment: any = this.resetPayment();

  constructor(
    private api: ApiService,
    private notify: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadPayments();
  }

  loadPayments(): void {
    this.api.getPayments().subscribe({
      next: (data) => (this.payments = data),
      error: () => this.notify.error('Could not load payments')
    });
  }

  filteredPayments(): Payment[] {
    if (!this.searchQuery) return this.payments;
    const q = this.searchQuery.toLowerCase();
    return this.payments.filter(
      (p) =>
        p.paymentNumber?.toLowerCase().includes(q) ||
        p.invoiceNumber?.toLowerCase().includes(q) ||
        p.referenceNumber?.toLowerCase().includes(q)
    );
  }

  openPaymentModal(): void {
    this.api.getInvoices().subscribe({
      next: (invs) => {
        this.payableInvoices = invs.filter(i => i.outstandingBalance > 0);
        this.newPayment = this.resetPayment();
        this.selectedInvoice = null;
        this.showPaymentModal = true;
      }
    });
  }

  onInvoiceSelected(): void {
    this.selectedInvoice = this.payableInvoices.find(i => i.id === this.newPayment.invoiceId) || null;
    if (this.selectedInvoice) {
      this.newPayment.amount = this.selectedInvoice.outstandingBalance;
    }
  }

  savePayment(): void {
    this.api.recordPayment(this.newPayment).subscribe({
      next: (p) => {
        this.notify.success(`Payment of ₹${p.amount} successfully posted against ${p.invoiceNumber}!`);
        this.loadPayments();
        this.showPaymentModal = false;
      },
      error: (err) => this.notify.error(err.error?.message || 'Failed to record payment')
    });
  }

  private resetPayment(): any {
    return {
      invoiceId: null,
      amount: 0,
      paymentDate: new Date().toISOString().substring(0, 10),
      paymentMethod: 'BANK_TRANSFER',
      referenceNumber: '',
      notes: ''
    };
  }
}
