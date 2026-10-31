import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { NotificationService } from '../../services/notification.service';
import { PurchaseOrder, Supplier, RawMaterial } from '../../models/models';

@Component({
  selector: 'app-purchase-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="toolbar">
        <div>
          <h2>Procurement & Purchase Orders</h2>
          <p style="color: #64748b; font-size: 13.5px;">Vendor orders, line item pricing, and goods receiving with automated inventory replenishment</p>
        </div>
        <div class="actions">
          <input
            type="text"
            class="search-input"
            placeholder="Search by PO #, supplier..."
            [(ngModel)]="searchQuery"
          />
          <button class="btn btn-primary" (click)="openCreateModal()">+ Create Purchase Order</button>
        </div>
      </div>

      <!-- Status Tabs Filter -->
      <div class="filter-tabs">
        <button class="tab-btn" [class.active]="activeTab === 'ALL'" (click)="activeTab = 'ALL'">
          All POs <span class="tab-badge">{{ purchaseOrders.length }}</span>
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'DRAFT'" (click)="activeTab = 'DRAFT'">
          Draft <span class="tab-badge">{{ countStatus('DRAFT') }}</span>
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'SUBMITTED'" (click)="activeTab = 'SUBMITTED'">
          Submitted <span class="tab-badge">{{ countStatus('SUBMITTED') }}</span>
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'RECEIVED'" (click)="activeTab = 'RECEIVED'">
          Received <span class="tab-badge">{{ countStatus('RECEIVED') }}</span>
        </button>
      </div>

      <div class="card">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>PO #</th>
                <th>Supplier Vendor</th>
                <th>Issue Date</th>
                <th>Expected Delivery</th>
                <th>Total Value</th>
                <th>Order Status</th>
                <th>Procurement Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (po of filteredPOs(); track po.id) {
                <tr>
                  <td><strong>{{ po.poNumber }}</strong></td>
                  <td>{{ po.supplier?.name }}</td>
                  <td>{{ po.orderDate }}</td>
                  <td>{{ po.expectedDeliveryDate || '-' }}</td>
                  <td><strong style="color: #0f172a;">₹{{ (po.totalAmount || 0) | number:'1.2-2' }}</strong></td>
                  <td>
                    <span class="badge" [ngClass]="{
                      'badge-secondary': po.status === 'DRAFT',
                      'badge-warning': po.status === 'SUBMITTED',
                      'badge-info': po.status === 'PARTIALLY_RECEIVED',
                      'badge-success': po.status === 'RECEIVED',
                      'badge-danger': po.status === 'CANCELLED'
                    }">{{ po.status }}</span>
                  </td>
                  <td>
                    <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                      @if (po.status === 'DRAFT') {
                        <button class="btn btn-primary btn-sm" (click)="submitPO(po)">Submit to Vendor</button>
                      }
                      @if (po.status === 'SUBMITTED' || po.status === 'PARTIALLY_RECEIVED') {
                        <button class="btn btn-success btn-sm" (click)="openReceiveModal(po)">Receive Inbound Goods</button>
                      }
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="7" style="text-align: center; color: #94a3b8; padding: 32px;">
                    No purchase orders found matching this filter.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Create PO Modal -->
      @if (showCreateModal) {
        <div class="modal-overlay">
          <div class="modal-content" style="max-width: 750px;">
            <div class="modal-header">
              <h3>Create Vendor Purchase Order</h3>
              <button class="close-btn" (click)="showCreateModal = false">&times;</button>
            </div>

            <form (ngSubmit)="savePO()">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                <div class="form-group">
                  <label>Supplier Vendor *</label>
                  <select [(ngModel)]="newPO.supplierId" name="supp" required>
                    <option [ngValue]="null" disabled>Select Supplier...</option>
                    @for (s of suppliers; track s.id) {
                      <option [value]="s.id">{{ s.name }} ({{ s.supplierCode }})</option>
                    }
                  </select>
                </div>
                <div class="form-group">
                  <label>Order Date *</label>
                  <input type="date" [(ngModel)]="newPO.orderDate" name="podate" required />
                </div>
              </div>

              <div class="form-group">
                <label>Expected Delivery Date</label>
                <input type="date" [(ngModel)]="newPO.expectedDeliveryDate" name="edate" />
              </div>

              <!-- Line Items -->
              <div style="margin-top: 20px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                  <h4 style="font-size: 14px;">Raw Material Lines *</h4>
                  <button type="button" class="btn btn-secondary btn-sm" (click)="addLineItem()">+ Add Material Line</button>
                </div>

                @for (item of newPO.items; track $index) {
                  <div style="display: grid; grid-template-columns: 2fr 1fr 1fr auto; gap: 10px; margin-bottom: 10px; align-items: center;">
                    <select [(ngModel)]="item.rawMaterialId" [name]="'rm_' + $index" (change)="onMaterialSelected(item)" required>
                      <option [ngValue]="null" disabled>Select Material...</option>
                      @for (rm of rawMaterials; track rm.id) {
                        <option [value]="rm.id">{{ rm.name }} ({{ rm.unitOfMeasure }})</option>
                      }
                    </select>
                    <input type="number" min="1" [(ngModel)]="item.quantity" [name]="'qty_' + $index" placeholder="Qty" required />
                    <input type="number" step="0.01" [(ngModel)]="item.unitPrice" [name]="'price_' + $index" placeholder="Cost" required />
                    <button type="button" class="btn btn-danger btn-sm" (click)="removeLineItem($index)">&times;</button>
                  </div>
                }
              </div>

              <div class="modal-actions">
                <button type="button" class="btn btn-secondary" (click)="showCreateModal = false">Cancel</button>
                <button type="submit" class="btn btn-primary" [disabled]="newPO.items.length === 0">Issue Purchase Order</button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Receive Goods Modal -->
      @if (showReceiveModal && selectedPo) {
        <div class="modal-overlay">
          <div class="modal-content" style="max-width: 700px;">
            <div class="modal-header">
              <div>
                <h3>Receive Goods: {{ selectedPo.poNumber }}</h3>
                <p style="font-size: 13px; color: #64748b;">Confirm physical arrival to automatically increase warehouse stock</p>
              </div>
              <button class="close-btn" (click)="showReceiveModal = false">&times;</button>
            </div>

            <form (ngSubmit)="commitGoodsReceipt()">
              <div class="form-group">
                <label>Receipt Timestamp *</label>
                <input type="date" [(ngModel)]="receiptPayload.receiptDate" name="rdate" required />
              </div>

              <div class="form-group">
                <label>Warehouse Inspector / Receiver</label>
                <input type="text" [(ngModel)]="receiptPayload.receivedBy" name="rby" placeholder="e.g. Warehouse Team Lead" />
              </div>

              <h4 style="margin: 16px 0 10px; font-size: 14px;">Items to Check-in:</h4>
              @for (item of receiptPayload.items; track $index) {
                <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 10px; margin-bottom: 10px; align-items: center;">
                  <div><strong>{{ item.rawMaterialName }}</strong></div>
                  <div>
                    <label style="font-size: 11px;">Qty Received</label>
                    <input type="number" [(ngModel)]="item.quantityReceived" [name]="'rqty_' + $index" required />
                  </div>
                  <div>
                    <label style="font-size: 11px;">Unit Cost ($)</label>
                    <input type="number" step="0.01" [(ngModel)]="item.unitPrice" [name]="'rcost_' + $index" required />
                  </div>
                </div>
              }

              <div class="modal-actions">
                <button type="button" class="btn btn-secondary" (click)="showReceiveModal = false">Cancel</button>
                <button type="submit" class="btn btn-success">Confirm Goods Receipt & Update Stock</button>
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
export class PurchaseOrdersComponent implements OnInit {
  purchaseOrders: PurchaseOrder[] = [];
  suppliers: Supplier[] = [];
  rawMaterials: RawMaterial[] = [];
  searchQuery = '';
  activeTab = 'ALL';

  showCreateModal = false;
  newPO: any = this.resetPO();

  showReceiveModal = false;
  selectedPo: PurchaseOrder | null = null;
  receiptPayload: any = { receiptDate: '', receivedBy: '', items: [] };

  constructor(
    private api: ApiService,
    private notify: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadPOs();
    this.api.getSuppliers().subscribe(s => (this.suppliers = s));
    this.api.getRawMaterials().subscribe(rm => (this.rawMaterials = rm));
  }

  loadPOs(): void {
    this.api.getPurchaseOrders().subscribe({
      next: (data) => (this.purchaseOrders = data),
      error: () => this.notify.error('Could not load purchase orders')
    });
  }

  countStatus(status: string): number {
    return this.purchaseOrders.filter(po => po.status === status).length;
  }

  filteredPOs(): PurchaseOrder[] {
    let result = this.purchaseOrders;
    if (this.activeTab !== 'ALL') {
      result = result.filter(po => po.status === this.activeTab);
    }
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(
        po =>
          po.poNumber?.toLowerCase().includes(q) ||
          po.supplier?.name.toLowerCase().includes(q) ||
          po.status.toLowerCase().includes(q)
      );
    }
    return result;
  }

  submitPO(po: PurchaseOrder): void {
    this.api.submitPurchaseOrder(po.id!).subscribe({
      next: () => {
        this.notify.success(`Purchase Order ${po.poNumber} submitted to vendor.`);
        this.loadPOs();
      },
      error: (err) => this.notify.error(err.error?.message || 'Failed to submit PO')
    });
  }

  openCreateModal(): void {
    this.newPO = this.resetPO();
    this.addLineItem();
    this.showCreateModal = true;
  }

  addLineItem(): void {
    this.newPO.items.push({
      rawMaterialId: null,
      quantity: 1,
      unitPrice: 0
    });
  }

  removeLineItem(idx: number): void {
    this.newPO.items.splice(idx, 1);
  }

  onMaterialSelected(item: any): void {
    const rm = this.rawMaterials.find(m => m.id === item.rawMaterialId);
    if (rm) {
      item.unitPrice = rm.unitCost;
    }
  }

  savePO(): void {
    this.api.createPurchaseOrder(this.newPO).subscribe({
      next: (res) => {
        this.notify.success(`Purchase Order ${res.poNumber} drafted.`);
        this.loadPOs();
        this.showCreateModal = false;
      },
      error: (err) => this.notify.error(err.error?.message || 'Could not draft PO')
    });
  }

  openReceiveModal(po: PurchaseOrder): void {
    this.selectedPo = po;
    this.receiptPayload = {
      purchaseOrderId: po.id,
      receiptDate: new Date().toISOString().substring(0, 10),
      receivedBy: 'Warehouse Logistics',
      items: po.items.map(it => ({
        purchaseOrderItemId: it.id,
        rawMaterialId: it.rawMaterialId,
        rawMaterialName: it.rawMaterialName,
        quantityReceived: it.quantity,
        unitPrice: it.unitPrice
      }))
    };
    this.showReceiveModal = true;
  }

  commitGoodsReceipt(): void {
    this.api.receiveGoods(this.selectedPo!.id!, this.receiptPayload).subscribe({
      next: () => {
        this.notify.success(`Goods received for ${this.selectedPo?.poNumber}! Warehouse raw material stock replenished.`);
        this.loadPOs();
        this.showReceiveModal = false;
      },
      error: (err) => this.notify.error(err.error?.message || 'Goods check-in failed')
    });
  }

  private resetPO(): any {
    return {
      supplierId: null,
      orderDate: new Date().toISOString().substring(0, 10),
      expectedDeliveryDate: '',
      notes: '',
      items: []
    };
  }
}
