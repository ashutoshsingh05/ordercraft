import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { NotificationService } from '../../services/notification.service';
import { CustomerOrder, Customer, Product } from '../../models/models';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="toolbar">
        <div>
          <h2>Customer Sales Orders</h2>
          <p style="color: #64748b; font-size: 13.5px;">End-to-end sales lifecycle, multi-line order dispatch, and production workflow</p>
        </div>
        <div class="actions">
          <input
            type="text"
            class="search-input"
            placeholder="Search by order #, customer..."
            [(ngModel)]="searchQuery"
          />
          <button class="btn btn-primary" (click)="openCreateModal()">+ Create Sales Order</button>
        </div>
      </div>

      <!-- Status Tabs Filter -->
      <div class="filter-tabs">
        <button class="tab-btn" [class.active]="activeTab === 'ALL'" (click)="activeTab = 'ALL'">
          All Orders <span class="tab-badge">{{ orders.length }}</span>
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'PENDING'" (click)="activeTab = 'PENDING'">
          Pending <span class="tab-badge">{{ countStatus('PENDING') }}</span>
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'CONFIRMED'" (click)="activeTab = 'CONFIRMED'">
          Confirmed <span class="tab-badge">{{ countStatus('CONFIRMED') }}</span>
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'IN_PRODUCTION'" (click)="activeTab = 'IN_PRODUCTION'">
          In Production <span class="tab-badge">{{ countStatus('IN_PRODUCTION') }}</span>
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'COMPLETED'" (click)="activeTab = 'COMPLETED'">
          Completed <span class="tab-badge">{{ countStatus('COMPLETED') }}</span>
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'DELIVERED'" (click)="activeTab = 'DELIVERED'">
          Delivered <span class="tab-badge">{{ countStatus('DELIVERED') }}</span>
        </button>
      </div>

      <div class="card">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Order Date</th>
                <th>Delivery Due</th>
                <th>Total Value</th>
                <th>Billing</th>
                <th>Workflow Status</th>
                <th>Workflow Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (o of filteredOrders(); track o.id) {
                <tr>
                  <td><strong>{{ o.orderNumber }}</strong></td>
                  <td>{{ o.customer?.name }}</td>
                  <td>{{ o.orderDate }}</td>
                  <td>{{ o.deliveryDate || '-' }}</td>
                  <td><strong style="color: #0f172a;">₹{{ (o.totalAmount || 0) | number:'1.2-2' }}</strong></td>
                  <td>
                    @if (o.invoiced) {
                      <span class="badge badge-success">INVOICED</span>
                    } @else {
                      <span class="badge badge-secondary">UNBILLED</span>
                    }
                  </td>
                  <td>
                    <span class="badge" [ngClass]="{
                      'badge-secondary': o.status === 'PENDING',
                      'badge-warning': o.status === 'CONFIRMED',
                      'badge-info': o.status === 'IN_PRODUCTION',
                      'badge-success': o.status === 'COMPLETED' || o.status === 'DELIVERED',
                      'badge-danger': o.status === 'CANCELLED'
                    }">{{ o.status }}</span>
                  </td>
                  <td>
                    <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                      <button class="btn btn-secondary btn-sm" (click)="viewOrder(o)">Details</button>
                      @if (o.status === 'PENDING') {
                        <button class="btn btn-warning btn-sm" (click)="changeStatus(o, 'CONFIRMED')">Confirm</button>
                      }
                      @if (o.status === 'CONFIRMED') {
                        <button class="btn btn-primary btn-sm" (click)="changeStatus(o, 'IN_PRODUCTION')">Start Job</button>
                      }
                      @if (o.status === 'IN_PRODUCTION') {
                        <button class="btn btn-success btn-sm" (click)="changeStatus(o, 'COMPLETED')">Complete</button>
                      }
                      @if (o.status === 'COMPLETED') {
                        <button class="btn btn-success btn-sm" (click)="changeStatus(o, 'DELIVERED')">Deliver</button>
                      }
                      @if (!o.invoiced && (o.status === 'COMPLETED' || o.status === 'DELIVERED' || o.status === 'IN_PRODUCTION')) {
                        <button class="btn btn-secondary btn-sm" style="color: #3b82f6;" (click)="quickInvoice(o)">Bill</button>
                      }
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="8" style="text-align: center; color: #94a3b8; padding: 32px;">
                    No sales orders found matching current filter.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Order Detail Modal -->
      @if (selectedOrder) {
        <div class="modal-overlay">
          <div class="modal-content" style="max-width: 750px;">
            <div class="modal-header">
              <div>
                <h3>Order {{ selectedOrder.orderNumber }} Details</h3>
                <p style="font-size: 13px; color: #64748b;">
                  Customer: <strong>{{ selectedOrder.customer?.name }}</strong> | Ordered: {{ selectedOrder.orderDate }}
                </p>
              </div>
              <button class="close-btn" (click)="selectedOrder = null">&times;</button>
            </div>

            <div style="margin-bottom: 20px;">
              <h4 style="margin-bottom: 12px; font-size: 14px;">Billable Order Items:</h4>
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Product Code</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of selectedOrder.items; track item.id) {
                    <tr>
                      <td><strong>{{ item.productName }}</strong></td>
                      <td>{{ item.productCode }}</td>
                      <td>{{ item.quantity }}</td>
                      <td>₹{{ item.unitPrice | number:'1.2-2' }}</td>
                      <td>₹{{ item.subtotal | number:'1.2-2' }}</td>
                    </tr>
                  }
                </tbody>
              </table>

              <div style="text-align: right; margin-top: 16px; font-size: 16px;">
                Grand Total Amount: <strong style="color: #10b981;">₹{{ (selectedOrder.totalAmount || 0) | number:'1.2-2' }}</strong>
              </div>
            </div>

            <div class="modal-actions">
              <button type="button" class="btn btn-secondary" (click)="selectedOrder = null">Close</button>
            </div>
          </div>
        </div>
      }

      <!-- Create Order Modal -->
      @if (showCreateModal) {
        <div class="modal-overlay">
          <div class="modal-content" style="max-width: 750px;">
            <div class="modal-header">
              <h3>Create Customer Sales Order</h3>
              <button class="close-btn" (click)="showCreateModal = false">&times;</button>
            </div>

            <form (ngSubmit)="saveOrder()">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                <div class="form-group">
                  <label>Customer Account *</label>
                  <select [(ngModel)]="newOrder.customerId" name="cust" required>
                    <option [ngValue]="null" disabled>Select Customer...</option>
                    @for (c of customers; track c.id) {
                      <option [value]="c.id">{{ c.name }} ({{ c.customerCode }})</option>
                    }
                  </select>
                </div>
                <div class="form-group">
                  <label>Order Date *</label>
                  <input type="date" [(ngModel)]="newOrder.orderDate" name="odate" required />
                </div>
              </div>

              <div class="form-group">
                <label>Target Delivery Date</label>
                <input type="date" [(ngModel)]="newOrder.deliveryDate" name="ddate" />
              </div>

              <div class="form-group">
                <label>Commercial Contract Notes</label>
                <input type="text" [(ngModel)]="newOrder.notes" name="notes" placeholder="e.g. Standard batch dispatch requirements" />
              </div>

              <!-- Line Items Builder -->
              <div style="margin-top: 20px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                  <h4 style="font-size: 14px;">Order Product Lines *</h4>
                  <button type="button" class="btn btn-secondary btn-sm" (click)="addLineItem()">+ Add Product Line</button>
                </div>

                @for (item of newOrder.items; track $index) {
                  <div style="display: grid; grid-template-columns: 2fr 1fr 1fr auto; gap: 10px; margin-bottom: 10px; align-items: center;">
                    <select [(ngModel)]="item.productId" [name]="'prod_' + $index" (change)="onProductSelected(item)" required>
                      <option [ngValue]="null" disabled>Select Product...</option>
                      @for (p of products; track p.id) {
                        <option [value]="p.id">{{ p.name }} (₹{{ p.unitPrice }})</option>
                      }
                    </select>
                    <input type="number" min="1" [(ngModel)]="item.quantity" [name]="'qty_' + $index" placeholder="Qty" required />
                    <input type="number" step="0.01" [(ngModel)]="item.unitPrice" [name]="'price_' + $index" placeholder="Price" required />
                    <button type="button" class="btn btn-danger btn-sm" (click)="removeLineItem($index)">&times;</button>
                  </div>
                }
              </div>

              <div class="modal-actions">
                <button type="button" class="btn btn-secondary" (click)="showCreateModal = false">Cancel</button>
                <button type="submit" class="btn btn-primary" [disabled]="newOrder.items.length === 0">Submit Order</button>
              </div>
            </form>
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
export class OrdersComponent implements OnInit {
  orders: CustomerOrder[] = [];
  customers: Customer[] = [];
  products: Product[] = [];
  searchQuery = '';
  activeTab: string = 'ALL';
  selectedOrder: CustomerOrder | null = null;

  showCreateModal = false;
  newOrder: any = this.resetOrder();

  constructor(
    private api: ApiService,
    private notify: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadOrders();
    this.api.getCustomers().subscribe(c => (this.customers = c));
    this.api.getProducts().subscribe(p => (this.products = p));
  }

  loadOrders(): void {
    this.api.getOrders().subscribe({
      next: (data) => (this.orders = data),
      error: () => this.notify.error('Could not load orders')
    });
  }

  countStatus(status: string): number {
    return this.orders.filter(o => o.status === status).length;
  }

  filteredOrders(): CustomerOrder[] {
    let result = this.orders;
    if (this.activeTab !== 'ALL') {
      result = result.filter(o => o.status === this.activeTab);
    }
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(
        o =>
          o.orderNumber?.toLowerCase().includes(q) ||
          o.customer?.name.toLowerCase().includes(q) ||
          o.status.toLowerCase().includes(q)
      );
    }
    return result;
  }

  viewOrder(o: CustomerOrder): void {
    this.selectedOrder = o;
  }

  changeStatus(order: CustomerOrder, newStatus: string): void {
    this.api.updateOrderStatus(order.id!, newStatus).subscribe({
      next: (updated) => {
        this.notify.success(`Order ${order.orderNumber} updated to ${newStatus}`);
        this.loadOrders();
      },
      error: (err) => this.notify.error(err.error?.message || 'Invalid workflow transition')
    });
  }

  quickInvoice(order: CustomerOrder): void {
    this.api.createInvoiceFromOrder(order.id!).subscribe({
      next: (inv) => {
        this.notify.success(`Generated Invoice ${inv.invoiceNumber} for Order ${order.orderNumber}`);
        this.loadOrders();
      },
      error: (err) => this.notify.error(err.error?.message || 'Could not invoice order')
    });
  }

  openCreateModal(): void {
    this.newOrder = this.resetOrder();
    this.addLineItem();
    this.showCreateModal = true;
  }

  addLineItem(): void {
    this.newOrder.items.push({
      productId: null,
      quantity: 1,
      unitPrice: 0,
      notes: ''
    });
  }

  removeLineItem(idx: number): void {
    this.newOrder.items.splice(idx, 1);
  }

  onProductSelected(item: any): void {
    const prod = this.products.find(p => p.id === item.productId);
    if (prod) {
      item.unitPrice = prod.unitPrice;
    }
  }

  saveOrder(): void {
    this.api.createOrder(this.newOrder).subscribe({
      next: (res) => {
        this.notify.success(`Sales Order ${res.orderNumber} successfully booked!`);
        this.loadOrders();
        this.showCreateModal = false;
      },
      error: (err) => this.notify.error(err.error?.message || 'Failed to create sales order')
    });
  }

  private resetOrder(): any {
    return {
      customerId: null,
      orderDate: new Date().toISOString().substring(0, 10),
      deliveryDate: '',
      notes: '',
      items: []
    };
  }
}
