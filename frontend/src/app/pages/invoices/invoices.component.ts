import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { NotificationService } from '../../services/notification.service';
import { Invoice, CustomerOrder } from '../../models/models';

@Component({
  selector: 'app-invoices',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="toolbar">
        <div>
          <h2>Customer Invoices & Accounts Receivable</h2>
          <p style="color: #64748b; font-size: 13.5px;">Generate invoices from fulfilled orders, compute taxes, and reconcile receivables</p>
        </div>
        <div class="actions">
          <input
            type="text"
            class="search-input"
            placeholder="Search by invoice #, customer..."
            [(ngModel)]="searchQuery"
          />
          <button class="btn btn-primary" (click)="openGenerateModal()">+ Generate Invoice</button>
        </div>
      </div>

      <!-- Status Tabs Filter -->
      <div class="filter-tabs">
        <button class="tab-btn" [class.active]="activeTab === 'ALL'" (click)="activeTab = 'ALL'">
          All Invoices <span class="tab-badge">{{ invoices.length }}</span>
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'ISSUED'" (click)="activeTab = 'ISSUED'">
          Issued <span class="tab-badge">{{ countStatus('ISSUED') }}</span>
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'PARTIALLY_PAID'" (click)="activeTab = 'PARTIALLY_PAID'">
          Partially Paid <span class="tab-badge">{{ countStatus('PARTIALLY_PAID') }}</span>
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'PAID'" (click)="activeTab = 'PAID'">
          Settled <span class="tab-badge">{{ countStatus('PAID') }}</span>
        </button>
      </div>

      <div class="card">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Order Ref</th>
                <th>Customer</th>
                <th>Invoice Date</th>
                <th>Due Date</th>
                <th>Total ($)</th>
                <th>Paid ($)</th>
                <th>Balance ($)</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (inv of filteredInvoices(); track inv.id) {
                <tr>
                  <td><strong>{{ inv.invoiceNumber }}</strong></td>
                  <td>{{ inv.customerOrderNumber }}</td>
                  <td>{{ inv.customer?.name }}</td>
                  <td>{{ inv.invoiceDate }}</td>
                  <td>{{ inv.dueDate }}</td>
                  <td>₹{{ inv.totalAmount | number:'1.2-2' }}</td>
                  <td style="color: #10b981;">₹{{ inv.paidAmount | number:'1.2-2' }}</td>
                  <td style="color: #ef4444; font-weight: 700;">₹{{ inv.outstandingBalance | number:'1.2-2' }}</td>
                  <td>
                    <span class="badge" [ngClass]="{
                      'badge-secondary': inv.status === 'DRAFT',
                      'badge-info': inv.status === 'ISSUED',
                      'badge-warning': inv.status === 'PARTIALLY_PAID',
                      'badge-success': inv.status === 'PAID',
                      'badge-danger': inv.status === 'OVERDUE' || inv.status === 'CANCELLED'
                    }">{{ inv.status }}</span>
                  </td>
                  <td>
                    <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                      <button class="btn btn-secondary btn-sm" (click)="viewInvoice(inv)">View</button>
                      @if (inv.outstandingBalance > 0) {
                        <button class="btn btn-success btn-sm" (click)="quickPayFull(inv)">Quick Settle</button>
                      }
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="10" style="text-align: center; color: #94a3b8; padding: 32px;">
                    No invoices found matching this filter.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Generate Invoice Modal -->
      @if (showGenerateModal) {
        <div class="modal-overlay">
          <div class="modal-content">
            <div class="modal-header">
              <h3>Generate Tax Invoice from Sales Order</h3>
              <button class="close-btn" (click)="showGenerateModal = false">&times;</button>
            </div>

            <form (ngSubmit)="generateInvoice()">
              <div class="form-group">
                <label>Eligible Customer Order *</label>
                <select [(ngModel)]="selectedOrderId" name="orderId" required>
                  <option [ngValue]="null" disabled>Choose Uninvoiced Order...</option>
                  @for (o of uninvoicedOrders; track o.id) {
                    <option [value]="o.id">
                      {{ o.orderNumber }} - {{ o.customer?.name }} (₹{{ o.totalAmount }})
                    </option>
                  }
                </select>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                <div class="form-group">
                  <label>Tax Rate (e.g. 0.05 for 5%)</label>
                  <input type="number" step="0.01" [(ngModel)]="taxRate" name="tax" />
                </div>
                <div class="form-group">
                  <label>Payment Terms (Days)</label>
                  <input type="number" [(ngModel)]="paymentTermsDays" name="terms" />
                </div>
              </div>

              <div class="modal-actions">
                <button type="button" class="btn btn-secondary" (click)="showGenerateModal = false">Cancel</button>
                <button type="submit" class="btn btn-primary" [disabled]="!selectedOrderId">Create Invoice</button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Invoice Detail Modal -->
      @if (activeInvoice) {
        <div class="modal-overlay">
          <div class="modal-content" style="max-width: 650px;">
            <div class="modal-header">
              <div>
                <h3>Tax Invoice: {{ activeInvoice.invoiceNumber }}</h3>
                <p style="font-size: 13px; color: #64748b;">
                  Billed to: <strong>{{ activeInvoice.customer?.name }}</strong> | Ref Order: {{ activeInvoice.customerOrderNumber }}
                </p>
              </div>
              <button class="close-btn" (click)="activeInvoice = null">&times;</button>
            </div>

            <div style="margin-bottom: 20px;">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Item Description</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of activeInvoice.items; track item.id) {
                    <tr>
                      <td>{{ item.description }}</td>
                      <td>{{ item.quantity }}</td>
                      <td>₹{{ item.unitPrice | number:'1.2-2' }}</td>
                      <td>₹{{ item.amount | number:'1.2-2' }}</td>
                    </tr>
                  }
                </tbody>
              </table>

              <div style="margin-top: 16px; border-top: 1px solid #e2e8f0; padding-top: 12px; font-size: 13.5px; display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
                <div>Subtotal: ₹{{ activeInvoice.subtotal | number:'1.2-2' }}</div>
                <div>GST (18%): ₹{{ activeInvoice.taxAmount | number:'1.2-2' }}</div>
                <div style="font-size: 16px; font-weight: 800; color: #0f172a;">
                  Total Amount: ₹{{ activeInvoice.totalAmount | number:'1.2-2' }}
                </div>
                <div style="color: #10b981;">Total Received: ₹{{ activeInvoice.paidAmount | number:'1.2-2' }}</div>
                <div style="color: #ef4444; font-weight: 700; font-size: 14px;">
                  Outstanding Balance: ₹{{ activeInvoice.outstandingBalance | number:'1.2-2' }}
                </div>
              </div>
            </div>

            <div class="modal-actions">
              <button type="button" class="btn btn-secondary" (click)="activeInvoice = null">Close</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .filter-tabs {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
      overflow-x: auto;
      padding-bottom: 4px;

      .tab-btn {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        padding: 8px 14px;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 600;
        color: #64748b;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: all 0.15s ease;

        &:hover {
          background: #f8fafc;
          color: #0f172a;
        }

        &.active {
          background: #3b82f6;
          color: #ffffff;
          border-color: #3b82f6;

          .tab-badge {
            background: rgba(255, 255, 255, 0.25);
            color: #ffffff;
          }
        }

        .tab-badge {
          background: #f1f5f9;
          color: #475569;
          padding: 2px 7px;
          border-radius: 9999px;
          font-size: 11px;
        }
      }
    }
  `]
})
export class InvoicesComponent implements OnInit {
  invoices: Invoice[] = [];
  uninvoicedOrders: CustomerOrder[] = [];
  searchQuery = '';
  activeTab = 'ALL';

  showGenerateModal = false;
  selectedOrderId: number | null = null;
  taxRate = 0.05;
  paymentTermsDays = 30;

  activeInvoice: Invoice | null = null;

  constructor(
    private api: ApiService,
    private notify: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadInvoices();
  }

  loadInvoices(): void {
    this.api.getInvoices().subscribe({
      next: (data) => (this.invoices = data),
      error: () => this.notify.error('Could not load invoices')
    });
  }

  countStatus(status: string): number {
    return this.invoices.filter(i => i.status === status).length;
  }

  filteredInvoices(): Invoice[] {
    let result = this.invoices;
    if (this.activeTab !== 'ALL') {
      result = result.filter(i => i.status === this.activeTab);
    }
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(
        i =>
          i.invoiceNumber?.toLowerCase().includes(q) ||
          i.customer?.name.toLowerCase().includes(q) ||
          i.customerOrderNumber?.toLowerCase().includes(q)
      );
    }
    return result;
  }

  viewInvoice(inv: Invoice): void {
    this.activeInvoice = inv;
  }

  quickPayFull(inv: Invoice): void {
    const paymentPayload = {
      invoiceId: inv.id,
      amount: inv.outstandingBalance,
      paymentDate: new Date().toISOString().substring(0, 10),
      paymentMethod: 'BANK_TRANSFER',
      referenceNumber: `SETTLE-${Date.now().toString().slice(-6)}`,
      notes: 'Full balance settled via quick settlement'
    };

    this.api.recordPayment(paymentPayload).subscribe({
      next: () => {
        this.notify.success(`Invoice ${inv.invoiceNumber} fully settled for ₹${inv.outstandingBalance}`);
        this.loadInvoices();
      },
      error: (err) => this.notify.error(err.error?.message || 'Payment settlement failed')
    });
  }

  openGenerateModal(): void {
    this.selectedOrderId = null;
    this.api.getOrders().subscribe({
      next: (orders) => {
        this.uninvoicedOrders = orders.filter(o => !o.invoiced);
        this.showGenerateModal = true;
      }
    });
  }

  generateInvoice(): void {
    if (!this.selectedOrderId) return;
    this.api.createInvoiceFromOrder(this.selectedOrderId, this.taxRate, this.paymentTermsDays).subscribe({
      next: (inv) => {
        this.notify.success(`Generated Tax Invoice ${inv.invoiceNumber}!`);
        this.loadInvoices();
        this.showGenerateModal = false;
      },
      error: (err) => this.notify.error(err.error?.message || 'Invoice generation failed')
    });
  }
}
