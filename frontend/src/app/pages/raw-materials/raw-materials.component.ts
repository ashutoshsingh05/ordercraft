import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { NotificationService } from '../../services/notification.service';
import { RawMaterial, InventoryTransaction } from '../../models/models';

@Component({
  selector: 'app-raw-materials',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="toolbar">
        <div>
          <h2>Raw Materials & Warehouse Ledger</h2>
          <p style="color: #64748b; font-size: 13.5px;">Live stock balances, reorder safety thresholds, and immutable movement auditing</p>
        </div>
        <div class="actions">
          <input
            type="text"
            class="search-input"
            placeholder="Search material code, name..."
            [(ngModel)]="searchQuery"
          />
          <button class="btn btn-primary" (click)="openMaterialModal()">+ Add Raw Material</button>
        </div>
      </div>

      <!-- Filter tabs -->
      <div class="filter-tabs">
        <button class="tab-btn" [class.active]="filterMode === 'ALL'" (click)="filterMode = 'ALL'">
          All Materials <span class="tab-badge">{{ materials.length }}</span>
        </button>
        <button class="tab-btn" [class.active]="filterMode === 'LOW_STOCK'" (click)="filterMode = 'LOW_STOCK'">
          Low Stock Alerts <span class="tab-badge" style="background: #fee2e2; color: #991b1b;">{{ lowStockCount }}</span>
        </button>
      </div>

      <div class="card">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Material Description</th>
                <th>Standard Cost</th>
                <th>Current Stock</th>
                <th>Reorder Level</th>
                <th>Health Status</th>
                <th>Ledger & Adjustments</th>
              </tr>
            </thead>
            <tbody>
              @for (m of filteredMaterials(); track m.id) {
                <tr [style.background-color]="m.lowStock ? '#fffbeb' : 'inherit'">
                  <td><strong>{{ m.materialCode }}</strong></td>
                  <td>
                    <div><strong>{{ m.name }}</strong></div>
                    <small style="color: #64748b;">{{ m.description }}</small>
                  </td>
                  <td>₹{{ m.unitCost | number:'1.2-2' }}</td>
                  <td>
                    <span [style.font-weight]="800" [style.color]="m.lowStock ? '#ef4444' : '#0f172a'" style="font-size: 14px;">
                      {{ m.currentStock }} {{ m.unitOfMeasure }}
                    </span>
                  </td>
                  <td>{{ m.reorderLevel }} {{ m.unitOfMeasure }}</td>
                  <td>
                    @if (m.lowStock) {
                      <span class="badge badge-danger">LOW STOCK ALERT</span>
                    } @else {
                      <span class="badge badge-success">HEALTHY</span>
                    }
                  </td>
                  <td>
                    <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                      <button class="btn btn-secondary btn-sm" (click)="openAdjustModal(m)">Adjust</button>
                      <button class="btn btn-secondary btn-sm" (click)="viewLedger(m)">Ledger Audit</button>
                      <button class="btn btn-secondary btn-sm" (click)="editMaterial(m)">Edit</button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="7" style="text-align: center; color: #94a3b8; padding: 32px;">No raw materials found.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Inventory Transaction Ledger Drawer -->
      @if (selectedMaterial) {
        <div class="card" style="border: 2px solid #10b981;">
          <div class="card-header">
            <div>
              <h3>Stock Movement Audit Ledger: {{ selectedMaterial.name }} ({{ selectedMaterial.materialCode }})</h3>
              <p style="font-size: 13px; color: #64748b; margin-top: 4px;">
                Complete audit trail of inbound receipts, manufacturing issues, and physical reconciliation
              </p>
            </div>
            <button class="btn btn-secondary btn-sm" (click)="selectedMaterial = null">Close</button>
          </div>

          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Transaction Type</th>
                  <th>Quantity</th>
                  <th>Stock Before</th>
                  <th>Stock After</th>
                  <th>Reference</th>
                  <th>Audit Notes</th>
                </tr>
              </thead>
              <tbody>
                @for (tx of transactions; track tx.id) {
                  <tr>
                    <td>{{ tx.createdAt | date:'short' }}</td>
                    <td>
                      <span class="badge" [ngClass]="{
                        'badge-success': tx.transactionType === 'PURCHASE_RECEIPT' || tx.transactionType === 'ADJUSTMENT_ADD' || tx.transactionType === 'INITIAL',
                        'badge-danger': tx.transactionType === 'PRODUCTION_ISSUE' || tx.transactionType === 'ADJUSTMENT_SUB'
                      }">{{ tx.transactionType }}</span>
                    </td>
                    <td [style.font-weight]="700" [style.color]="tx.transactionType === 'PRODUCTION_ISSUE' || tx.transactionType === 'ADJUSTMENT_SUB' ? '#ef4444' : '#10b981'">
                      {{ tx.transactionType === 'PRODUCTION_ISSUE' || tx.transactionType === 'ADJUSTMENT_SUB' ? '-' : '+' }}{{ tx.quantity }}
                    </td>
                    <td>{{ tx.stockBefore }}</td>
                    <td><strong>{{ tx.stockAfter }}</strong></td>
                    <td>{{ tx.referenceNumber || '-' }}</td>
                    <td>{{ tx.notes || '-' }}</td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="7" style="text-align: center; color: #94a3b8; padding: 24px;">No movements logged yet.</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- Add/Edit Material Modal -->
      @if (showMaterialModal) {
        <div class="modal-overlay">
          <div class="modal-content">
            <div class="modal-header">
              <h3>{{ editingMaterial?.id ? 'Edit Raw Material' : 'Add Raw Material' }}</h3>
              <button class="close-btn" (click)="showMaterialModal = false">&times;</button>
            </div>
            <form (ngSubmit)="saveMaterial()">
              <div class="form-group">
                <label>Material Code *</label>
                <input type="text" [(ngModel)]="currentMaterial.materialCode" name="code" required />
              </div>
              <div class="form-group">
                <label>Material Name *</label>
                <input type="text" [(ngModel)]="currentMaterial.name" name="name" required />
              </div>
              <div class="form-group">
                <label>Technical Description *</label>
                <textarea [(ngModel)]="currentMaterial.description" name="desc" rows="2" required></textarea>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                <div class="form-group">
                  <label>Unit of Measure *</label>
                  <input type="text" [(ngModel)]="currentMaterial.unitOfMeasure" name="uom" placeholder="e.g. KG, PCS, M" required />
                </div>
                <div class="form-group">
                  <label>Standard Unit Cost ($) *</label>
                  <input type="number" step="0.01" [(ngModel)]="currentMaterial.unitCost" name="cost" required />
                </div>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                <div class="form-group">
                  <label>Reorder Level *</label>
                  <input type="number" step="0.1" [(ngModel)]="currentMaterial.reorderLevel" name="reorder" required />
                </div>
                <div class="form-group">
                  <label>Minimum Stock Level *</label>
                  <input type="number" step="0.1" [(ngModel)]="currentMaterial.minStockLevel" name="min" required />
                </div>
              </div>
              <div class="modal-actions">
                <button type="button" class="btn btn-secondary" (click)="showMaterialModal = false">Cancel</button>
                <button type="submit" class="btn btn-primary">Save Material</button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Adjust Stock Modal -->
      @if (showAdjustModal && adjustingMaterial) {
        <div class="modal-overlay">
          <div class="modal-content">
            <div class="modal-header">
              <h3>Adjust Physical Stock: {{ adjustingMaterial.name }}</h3>
              <button class="close-btn" (click)="showAdjustModal = false">&times;</button>
            </div>
            <form (ngSubmit)="submitAdjustment()">
              <p style="font-size: 13.5px; margin-bottom: 16px; color: #475569;">
                Current Stock Balance: <strong>{{ adjustingMaterial.currentStock }} {{ adjustingMaterial.unitOfMeasure }}</strong>
              </p>
              <div class="form-group">
                <label>Adjustment Direction *</label>
                <select [(ngModel)]="adjustmentReq.adjustmentType" name="adjType" required>
                  <option value="ADD">Increase Warehouse Stock (+)</option>
                  <option value="SUBTRACT">Decrease Warehouse Stock (-)</option>
                </select>
              </div>
              <div class="form-group">
                <label>Quantity to Adjust *</label>
                <input type="number" step="0.01" [(ngModel)]="adjustmentReq.quantity" name="adjQty" required />
              </div>
              <div class="form-group">
                <label>Reason / Audit Log Note *</label>
                <input type="text" [(ngModel)]="adjustmentReq.notes" name="adjNotes" placeholder="e.g. Cycle count physical reconciliation" required />
              </div>
              <div class="modal-actions">
                <button type="button" class="btn btn-secondary" (click)="showAdjustModal = false">Cancel</button>
                <button type="submit" class="btn btn-primary">Commit Stock Adjustment</button>
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
export class RawMaterialsComponent implements OnInit {
  materials: RawMaterial[] = [];
  searchQuery = '';
  filterMode: 'ALL' | 'LOW_STOCK' = 'ALL';
  selectedMaterial: RawMaterial | null = null;
  transactions: InventoryTransaction[] = [];

  showMaterialModal = false;
  editingMaterial: RawMaterial | null = null;
  currentMaterial: RawMaterial = this.resetMaterial();

  showAdjustModal = false;
  adjustingMaterial: RawMaterial | null = null;
  adjustmentReq = { adjustmentType: 'ADD', quantity: 0, notes: '' };

  constructor(
    private api: ApiService,
    private notify: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadMaterials();
  }

  loadMaterials(): void {
    this.api.getRawMaterials().subscribe({
      next: (data) => (this.materials = data),
      error: () => this.notify.error('Could not load inventory materials')
    });
  }

  get lowStockCount(): number {
    return this.materials.filter(m => m.lowStock).length;
  }

  filteredMaterials(): RawMaterial[] {
    let result = this.materials;
    if (this.filterMode === 'LOW_STOCK') {
      result = result.filter(m => m.lowStock);
    }
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(
        (m) => m.name.toLowerCase().includes(q) || m.materialCode.toLowerCase().includes(q)
      );
    }
    return result;
  }

  viewLedger(m: RawMaterial): void {
    this.selectedMaterial = m;
    this.api.getMaterialTransactions(m.id!).subscribe({
      next: (txs) => (this.transactions = txs),
      error: () => this.notify.error('Could not load transaction ledger')
    });
  }

  openMaterialModal(): void {
    this.editingMaterial = null;
    this.currentMaterial = this.resetMaterial();
    this.showMaterialModal = true;
  }

  editMaterial(m: RawMaterial): void {
    this.editingMaterial = m;
    this.currentMaterial = { ...m };
    this.showMaterialModal = true;
  }

  saveMaterial(): void {
    if (this.editingMaterial?.id) {
      this.api.updateRawMaterial(this.editingMaterial.id, this.currentMaterial).subscribe({
        next: () => {
          this.notify.success('Raw material updated successfully');
          this.loadMaterials();
          this.showMaterialModal = false;
        },
        error: (err) => this.notify.error(err.error?.message || 'Update failed')
      });
    } else {
      this.api.createRawMaterial(this.currentMaterial).subscribe({
        next: () => {
          this.notify.success('Raw material registered in catalogue');
          this.loadMaterials();
          this.showMaterialModal = false;
        },
        error: (err) => this.notify.error(err.error?.message || 'Creation failed')
      });
    }
  }

  openAdjustModal(m: RawMaterial): void {
    this.adjustingMaterial = m;
    this.adjustmentReq = { adjustmentType: 'ADD', quantity: 0, notes: '' };
    this.showAdjustModal = true;
  }

  submitAdjustment(): void {
    if (!this.adjustingMaterial?.id) return;
    this.api.adjustStock(this.adjustingMaterial.id, this.adjustmentReq).subscribe({
      next: () => {
        this.notify.success(`Stock balance adjusted for ${this.adjustingMaterial?.materialCode}`);
        this.loadMaterials();
        this.showAdjustModal = false;
      },
      error: (err) => this.notify.error(err.error?.message || 'Adjustment failed')
    });
  }

  private resetMaterial(): RawMaterial {
    return {
      materialCode: '',
      name: '',
      description: '',
      unitOfMeasure: 'KG',
      unitCost: 0,
      currentStock: 0,
      minStockLevel: 10,
      reorderLevel: 25,
      active: true
    };
  }
}
