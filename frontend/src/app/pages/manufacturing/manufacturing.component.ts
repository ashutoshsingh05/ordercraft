import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { NotificationService } from '../../services/notification.service';
import { ManufacturingOrder, CustomerOrder, Product, MaterialRequirement } from '../../models/models';

@Component({
  selector: 'app-manufacturing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="toolbar">
        <div>
          <h2>Manufacturing & Shop Floor Execution</h2>
          <p style="color: #64748b; font-size: 13.5px;">Schedule jobs, deduct BOM materials, check shortages, and record finished production</p>
        </div>
        <div class="actions">
          <input
            type="text"
            class="search-input"
            placeholder="Search by MO #, product..."
            [(ngModel)]="searchQuery"
          />
          <button class="btn btn-primary" (click)="openCreateModal()">+ Schedule Production Job</button>
        </div>
      </div>

      <!-- Status Tabs Filter -->
      <div class="filter-tabs">
        <button class="tab-btn" [class.active]="activeTab === 'ALL'" (click)="activeTab = 'ALL'">
          All Jobs <span class="tab-badge">{{ manufacturingOrders.length }}</span>
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'PLANNED'" (click)="activeTab = 'PLANNED'">
          Planned <span class="tab-badge">{{ countStatus('PLANNED') }}</span>
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'IN_PROGRESS'" (click)="activeTab = 'IN_PROGRESS'">
          In Progress <span class="tab-badge">{{ countStatus('IN_PROGRESS') }}</span>
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'COMPLETED'" (click)="activeTab = 'COMPLETED'">
          Completed <span class="tab-badge">{{ countStatus('COMPLETED') }}</span>
        </button>
      </div>

      <div class="card">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>MO #</th>
                <th>Sales Order Ref</th>
                <th>Product to Make</th>
                <th>Units Required</th>
                <th>BOM Issued</th>
                <th>Start Date</th>
                <th>Production Status</th>
                <th>Floor Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (mo of filteredMOs(); track mo.id) {
                <tr>
                  <td><strong>{{ mo.moNumber }}</strong></td>
                  <td>{{ mo.customerOrderNumber }} ({{ mo.customerName }})</td>
                  <td><strong>{{ mo.productName }}</strong> <small style="color: #64748b;">({{ mo.productCode }})</small></td>
                  <td><span class="badge badge-info">{{ mo.quantityToProduce }} units</span></td>
                  <td>
                    @if (mo.materialsIssued) {
                      <span class="badge badge-success">DEDUCTED</span>
                    } @else {
                      <span class="badge badge-secondary">PENDING</span>
                    }
                  </td>
                  <td>{{ mo.startDate || '-' }}</td>
                  <td>
                    <span class="badge" [ngClass]="{
                      'badge-secondary': mo.status === 'PLANNED',
                      'badge-info': mo.status === 'IN_PROGRESS',
                      'badge-success': mo.status === 'COMPLETED',
                      'badge-danger': mo.status === 'CANCELLED'
                    }">{{ mo.status }}</span>
                  </td>
                  <td>
                    <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                      <button class="btn btn-secondary btn-sm" (click)="checkShortages(mo)">Shortage Check</button>
                      @if (mo.status === 'PLANNED') {
                        <button class="btn btn-primary btn-sm" (click)="startProduction(mo)">Start (Issue BOM)</button>
                      }
                      @if (mo.status === 'IN_PROGRESS') {
                        <button class="btn btn-success btn-sm" (click)="completeProduction(mo)">Finish Job</button>
                      }
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="8" style="text-align: center; color: #94a3b8; padding: 32px;">
                    No production jobs match the selected filter.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Shortage Verification Drawer -->
      @if (selectedMo) {
        <div class="card" style="border: 2px solid #3b82f6;">
          <div class="card-header">
            <div>
              <h3>Material Availability Check: {{ selectedMo.moNumber }}</h3>
              <p style="font-size: 13px; color: #64748b; margin-top: 4px;">
                Required raw material components to manufacture <strong>{{ selectedMo.quantityToProduce }}</strong> units of <strong>{{ selectedMo.productName }}</strong>
              </p>
            </div>
            <button class="btn btn-secondary btn-sm" (click)="selectedMo = null">Close</button>
          </div>

          <table class="data-table">
            <thead>
              <tr>
                <th>Raw Material</th>
                <th>Required for Batch</th>
                <th>Current In-Stock</th>
                <th>Shortage Deficit</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              @for (req of shortages; track req.rawMaterialId) {
                <tr>
                  <td><strong>{{ req.rawMaterialName }}</strong> ({{ req.rawMaterialCode }})</td>
                  <td>{{ req.quantityNeeded }} {{ req.unitOfMeasure }}</td>
                  <td>{{ req.currentStock }} {{ req.unitOfMeasure }}</td>
                  <td [style.color]="req.shortageQuantity > 0 ? '#ef4444' : '#64748b'" [style.font-weight]="req.shortageQuantity > 0 ? 'bold' : 'normal'">
                    {{ req.shortageQuantity }} {{ req.unitOfMeasure }}
                  </td>
                  <td>
                    <span class="badge" [ngClass]="req.hasSufficientStock ? 'badge-success' : 'badge-danger'">
                      {{ req.hasSufficientStock ? 'SUFFICIENT STOCK' : 'MATERIAL SHORTAGE' }}
                    </span>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5" style="text-align: center; color: #94a3b8; padding: 24px;">No components to verify.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- Create Manufacturing Order Modal -->
      @if (showCreateModal) {
        <div class="modal-overlay">
          <div class="modal-content">
            <div class="modal-header">
              <h3>Schedule Production Order</h3>
              <button class="close-btn" (click)="showCreateModal = false">&times;</button>
            </div>

            <form (ngSubmit)="saveMO()">
              <div class="form-group">
                <label>Sales Order Reference *</label>
                <select [(ngModel)]="newMO.customerOrderId" name="orderId" required>
                  <option [ngValue]="null" disabled>Choose Sales Order...</option>
                  @for (o of customerOrders; track o.id) {
                    <option [value]="o.id">{{ o.orderNumber }} - {{ o.customer?.name }}</option>
                  }
                </select>
              </div>

              <div class="form-group">
                <label>Product to Manufacture *</label>
                <select [(ngModel)]="newMO.productId" name="prodId" required>
                  <option [ngValue]="null" disabled>Choose Product...</option>
                  @for (p of products; track p.id) {
                    <option [value]="p.id">{{ p.name }} ({{ p.productCode }})</option>
                  }
                </select>
              </div>

              <div class="form-group">
                <label>Quantity to Produce *</label>
                <input type="number" min="1" [(ngModel)]="newMO.quantityToProduce" name="qty" required />
              </div>

              <div class="form-group">
                <label>Production Instructions / Line Assignment</label>
                <input type="text" [(ngModel)]="newMO.notes" name="notes" placeholder="e.g. Workstation line 3" />
              </div>

              <div class="modal-actions">
                <button type="button" class="btn btn-secondary" (click)="showCreateModal = false">Cancel</button>
                <button type="submit" class="btn btn-primary">Schedule Production</button>
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
export class ManufacturingComponent implements OnInit {
  manufacturingOrders: ManufacturingOrder[] = [];
  customerOrders: CustomerOrder[] = [];
  products: Product[] = [];
  searchQuery = '';
  activeTab = 'ALL';

  selectedMo: ManufacturingOrder | null = null;
  shortages: MaterialRequirement[] = [];

  showCreateModal = false;
  newMO: any = { customerOrderId: null, productId: null, quantityToProduce: 1, notes: '' };

  constructor(
    private api: ApiService,
    private notify: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadMOs();
    this.api.getOrders().subscribe(o => (this.customerOrders = o));
    this.api.getProducts().subscribe(p => (this.products = p));
  }

  loadMOs(): void {
    this.api.getManufacturingOrders().subscribe({
      next: (data) => (this.manufacturingOrders = data),
      error: () => this.notify.error('Could not load production orders')
    });
  }

  countStatus(status: string): number {
    return this.manufacturingOrders.filter(m => m.status === status).length;
  }

  filteredMOs(): ManufacturingOrder[] {
    let result = this.manufacturingOrders;
    if (this.activeTab !== 'ALL') {
      result = result.filter(m => m.status === this.activeTab);
    }
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(
        m =>
          m.moNumber?.toLowerCase().includes(q) ||
          m.productName?.toLowerCase().includes(q) ||
          m.customerName?.toLowerCase().includes(q)
      );
    }
    return result;
  }

  checkShortages(mo: ManufacturingOrder): void {
    this.selectedMo = mo;
    this.api.checkMoShortages(mo.id!).subscribe({
      next: (res) => (this.shortages = res),
      error: () => this.notify.error('Failed to run stock feasibility analysis')
    });
  }

  startProduction(mo: ManufacturingOrder): void {
    this.api.startProduction(mo.id!).subscribe({
      next: () => {
        this.notify.success(`Production started for ${mo.moNumber}. Required BOM components deducted from inventory.`);
        this.loadMOs();
      },
      error: (err) => this.notify.error(err.error?.message || 'Cannot start production due to raw material shortages.')
    });
  }

  completeProduction(mo: ManufacturingOrder): void {
    this.api.completeProduction(mo.id!).subscribe({
      next: () => {
        this.notify.success(`Job ${mo.moNumber} marked COMPLETED.`);
        this.loadMOs();
      },
      error: (err) => this.notify.error(err.error?.message || 'Could not complete job')
    });
  }

  openCreateModal(): void {
    this.newMO = { customerOrderId: null, productId: null, quantityToProduce: 1, notes: '' };
    this.showCreateModal = true;
  }

  saveMO(): void {
    this.api.createManufacturingOrder(this.newMO).subscribe({
      next: (res) => {
        this.notify.success(`Production Job ${res.moNumber} scheduled!`);
        this.loadMOs();
        this.showCreateModal = false;
      },
      error: (err) => this.notify.error(err.error?.message || 'Failed to schedule production order')
    });
  }
}
