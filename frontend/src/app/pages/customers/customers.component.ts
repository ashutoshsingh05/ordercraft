import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { NotificationService } from '../../services/notification.service';
import { Customer } from '../../models/models';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="toolbar">
        <div>
          <h2>Customer Directory</h2>
          <p style="color: #64748b; font-size: 13.5px;">Manage commercial accounts, GSTIN compliance, and factory billing entities</p>
        </div>
        <div class="actions">
          <input
            type="text"
            class="search-input"
            placeholder="Search customers..."
            [(ngModel)]="searchQuery"
          />
          <button class="btn btn-primary" (click)="openModal()">+ Add Customer</button>
        </div>
      </div>

      <div class="card">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Company Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>GSTIN / PAN</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (c of filteredCustomers(); track c.id) {
                <tr>
                  <td><strong>{{ c.customerCode }}</strong></td>
                  <td><strong>{{ c.name }}</strong></td>
                  <td>{{ c.email }}</td>
                  <td>{{ c.phone }}</td>
                  <td>{{ c.taxId || 'N/A' }}</td>
                  <td>
                    <span class="badge" [ngClass]="c.active ? 'badge-success' : 'badge-danger'">
                      {{ c.active ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td>
                    <button class="btn btn-secondary btn-sm" (click)="editCustomer(c)">Edit</button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="7" style="text-align: center; color: #94a3b8; padding: 24px;">No customers found</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Add/Edit Modal -->
      @if (showModal) {
        <div class="modal-overlay">
          <div class="modal-content">
            <div class="modal-header">
              <h3>{{ editingCustomer?.id ? 'Edit Customer' : 'Create Customer' }}</h3>
              <button class="close-btn" (click)="closeModal()">&times;</button>
            </div>

            <form (ngSubmit)="saveCustomer()">
              <div class="form-group">
                <label>Customer Code *</label>
                <input type="text" [(ngModel)]="currentCustomer.customerCode" name="code" required />
              </div>

              <div class="form-group">
                <label>Company / Customer Name *</label>
                <input type="text" [(ngModel)]="currentCustomer.name" name="name" required />
              </div>

              <div class="form-group">
                <label>Email Address *</label>
                <input type="email" [(ngModel)]="currentCustomer.email" name="email" required />
              </div>

              <div class="form-group">
                <label>Phone Number *</label>
                <input type="text" [(ngModel)]="currentCustomer.phone" name="phone" required />
              </div>

              <div class="form-group">
                <label>Billing & Delivery Address *</label>
                <textarea [(ngModel)]="currentCustomer.address" name="address" rows="3" required></textarea>
              </div>

              <div class="form-group">
                <label>GSTIN / PAN Identification</label>
                <input type="text" [(ngModel)]="currentCustomer.taxId" name="taxId" placeholder="e.g. 27AAACT2727Q1ZW" />
              </div>

              <div class="modal-actions">
                <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Save Customer</button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `
})
export class CustomersComponent implements OnInit {
  customers: Customer[] = [];
  searchQuery = '';
  showModal = false;
  editingCustomer: Customer | null = null;

  currentCustomer: Customer = this.resetCustomer();

  constructor(
    private api: ApiService,
    private notify: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.api.getCustomers().subscribe({
      next: (data) => (this.customers = data),
      error: () => this.notify.error('Could not load customers')
    });
  }

  filteredCustomers(): Customer[] {
    if (!this.searchQuery) return this.customers;
    const q = this.searchQuery.toLowerCase();
    return this.customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.customerCode.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
    );
  }

  openModal(): void {
    this.editingCustomer = null;
    this.currentCustomer = this.resetCustomer();
    this.showModal = true;
  }

  editCustomer(c: Customer): void {
    this.editingCustomer = c;
    this.currentCustomer = { ...c };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  saveCustomer(): void {
    if (this.editingCustomer?.id) {
      this.api.updateCustomer(this.editingCustomer.id, this.currentCustomer).subscribe({
        next: () => {
          this.notify.success('Customer profile updated');
          this.loadCustomers();
          this.closeModal();
        },
        error: (err) => this.notify.error(err.error?.message || 'Update failed')
      });
    } else {
      this.api.createCustomer(this.currentCustomer).subscribe({
        next: () => {
          this.notify.success('Customer registered successfully');
          this.loadCustomers();
          this.closeModal();
        },
        error: (err) => this.notify.error(err.error?.message || 'Creation failed')
      });
    }
  }

  private resetCustomer(): Customer {
    return {
      customerCode: '',
      name: '',
      email: '',
      phone: '',
      address: '',
      taxId: '',
      active: true
    };
  }
}
