import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <div class="toolbar">
        <div>
          <h2>Operational & Financial Reports</h2>
          <p style="color: #64748b; font-size: 13.5px;">Export full ledger datasets and business summaries to CSV</p>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;">
        <!-- Sales Order Report -->
        <div class="card">
          <div class="card-header">
            <h3>Customer Orders Ledger</h3>
          </div>
          <p style="font-size: 13.5px; color: #64748b; margin-bottom: 20px;">
            Full history of sales orders, item totals, workflow statuses, and customer linkages.
          </p>
          <button (click)="downloadReport(api.exportOrdersUrl(), 'orders-report.csv')" class="btn btn-primary">
            Export Orders CSV
          </button>
        </div>

        <!-- Invoices Report -->
        <div class="card">
          <div class="card-header">
            <h3>Sales & Invoicing Ledger</h3>
          </div>
          <p style="font-size: 13.5px; color: #64748b; margin-bottom: 20px;">
            Detailed invoice items, tax assessments, due dates, and settlement progress.
          </p>
          <button (click)="downloadReport(api.exportInvoicesUrl(), 'invoices-report.csv')" class="btn btn-primary">
            Export Invoices CSV
          </button>
        </div>

        <!-- Inventory Report -->
        <div class="card">
          <div class="card-header">
            <h3>Raw Materials & Stock Report</h3>
          </div>
          <p style="font-size: 13.5px; color: #64748b; margin-bottom: 20px;">
            Current stock valuations, reorder thresholds, and low-inventory shortage flags.
          </p>
          <button (click)="downloadReport(api.exportInventoryUrl(), 'inventory-report.csv')" class="btn btn-primary">
            Export Inventory CSV
          </button>
        </div>

        <!-- Payments Report -->
        <div class="card">
          <div class="card-header">
            <h3>Cash Receipts & Payments</h3>
          </div>
          <p style="font-size: 13.5px; color: #64748b; margin-bottom: 20px;">
            Audited cash inflows, settlement dates, payment methods, and transaction references.
          </p>
          <button (click)="downloadReport(api.exportPaymentsUrl(), 'payments-report.csv')" class="btn btn-primary">
            Export Payments CSV
          </button>
        </div>
      </div>
    </div>
  `
})
export class ReportsComponent {
  constructor(public api: ApiService, private http: HttpClient) {}

  downloadReport(url: string, filename: string): void {
    this.http.get(url, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const a = document.createElement('a');
        const objectUrl = URL.createObjectURL(blob);
        a.href = objectUrl;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(objectUrl);
      },
      error: (err) => console.error('Failed to download report', err)
    });
  }
}
