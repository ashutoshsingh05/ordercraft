import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { NotificationService } from '../../services/notification.service';
import { Supplier } from '../../models/models';

@Component({
  selector: 'app-suppliers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="toolbar">
        <div>
          <h2>Supplier Directory</h2>
          <p style="color: #64748b; font-size: 13.5px;">Manage raw material vendors, contractual lead times, and procurement terms</p>
        </div>
        <div class="actions">
          <input
            type="text"
            class="search-input"
            placeholder="Search suppliers..."
            [(ngModel)]="searchQuery"
          />
          <button class="btn btn-primary" (click)="openModal()">+ Add Supplier</button>
        </div>
      </div>

      <div class="card">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Supplier Name</th>
                <th>Contact Person</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Lead Time</th>
                <th>Payment Terms</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (s of filteredSuppliers(); track s.id) {
                <tr>
                  <td><strong>{{ s.supplierCode }}</strong></td>
                  <td><strong>{{ s.name }}</strong></td>
                  <td>{{ s.contactPerson }}</td>
                  <td>{{ s.email }}</td>
                  <td>{{ s.phone }}</td>
                  <td>{{ s.leadTimeDays || 0 }} days</td>
                  <td>{{ s.paymentTerms || 'Standard' }}</td>
                  <td>
                    <span class="badge" [ngClass]="s.active ? 'badge-success' : 'badge-danger'">
                      {{ s.active ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td>
                    <button class="btn btn-secondary btn-sm" (click)="editSupplier(s)">Edit</button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="9" style="text-align: center; color: #94a3b8; padding: 24px;">No suppliers found</td>
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
              <h3>{{ editingSupplier?.id ? 'Edit Supplier' : 'Register Supplier' }}</h3>
              <button class="close-btn" (click)="closeModal()">&times;</button>
            </div>

            <form (ngSubmit)="saveSupplier()">
              <div class="form-group">
                <label>Supplier Code *</label>
                <input type="text" [(ngModel)]="currentSupplier.supplierCode" name="code" required />
              </div>

              <div class="form-group">
                <label>Company Name *</label>
                <input type="text" [(ngModel)]="currentSupplier.name" name="name" required />
              </div>

              <div class="form-group">
                <label>Contact Person *</label>
                <input type="text" [(ngModel)]="currentSupplier.contactPerson" name="contact" required />
              </div>

              <div class="form-group">
                <label>Email Address *</label>
                <input type="email" [(ngModel)]="currentSupplier.email" name="email" required />
              </div>

              <div class="form-group">
                <label>Phone Number *</label>
                <input type="text" [(ngModel)]="currentSupplier.phone" name="phone" required />
              </div>

              <div class="form-group">
                <label>Address *</label>
                <textarea [(ngModel)]="currentSupplier.address" name="address" rows="2" required></textarea>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                <div class="form-group">
                  <label>Lead Time (Days)</label>
                  <input type="number" [(ngModel)]="currentSupplier.leadTimeDays" name="leadTime" />
                </div>
                <div class="form-group">
                  <label>Payment Terms</label>
                  <input type="text" [(ngModel)]="currentSupplier.paymentTerms" name="paymentTerms" placeholder="e.g. Net 30" />
                </div>
              </div>

              <div class="modal-actions">
                <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Save Supplier</button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `
})
export class SuppliersComponent implements OnInit {
  suppliers: Supplier[] = [];
  searchQuery = '';
  showModal = false;
  editingSupplier: Supplier | null = null;

  currentSupplier: Supplier = this.resetSupplier();

  constructor(
    private api: ApiService,
    private notify: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadSuppliers();
  }

  loadSuppliers(): void {
    this.api.getSuppliers().subscribe({
      next: (data) => (this.suppliers = data),
      error: () => this.notify.error('Could not load suppliers')
    });
  }

  filteredSuppliers(): Supplier[] {
    if (!this.searchQuery) return this.suppliers;
    const q = this.searchQuery.toLowerCase();
    return this.suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.supplierCode.toLowerCase().includes(q) ||
        s.contactPerson.toLowerCase().includes(q)
    );
  }

  openModal(): void {
    this.editingSupplier = null;
    this.currentSupplier = this.resetSupplier();
    this.showModal = true;
  }

  editSupplier(s: Supplier): void {
    this.editingSupplier = s;
    this.currentSupplier = { ...s };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  saveSupplier(): void {
    if (this.editingSupplier?.id) {
      this.api.updateSupplier(this.editingSupplier.id, this.currentSupplier).subscribe({
        next: () => {
          this.notify.success('Supplier details updated');
          this.loadSuppliers();
          this.closeModal();
        },
        error: (err) => this.notify.error(err.error?.message || 'Update failed')
      });
    } else {
      this.api.createSupplier(this.currentSupplier).subscribe({
        next: () => {
          this.notify.success('Supplier registered');
          this.loadSuppliers();
          this.closeModal();
        },
        error: (err) => this.notify.error(err.error?.message || 'Registration failed')
      });
    }
  }

  private resetSupplier(): Supplier {
    return {
      supplierCode: '',
      name: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      leadTimeDays: 7,
      paymentTerms: 'Net 30',
      active: true
    };
  }
}
