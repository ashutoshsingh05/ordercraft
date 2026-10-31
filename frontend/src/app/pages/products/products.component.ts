import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { NotificationService } from '../../services/notification.service';
import { Product, BomItem, RawMaterial, MaterialRequirement } from '../../models/models';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="toolbar">
        <div>
          <h2>Manufactured Products & Bill of Materials (BOM)</h2>
          <p style="color: #64748b; font-size: 13.5px;">Finished goods catalogue, sub-assemblies, and multi-component BOM engineering</p>
        </div>
        <div class="actions">
          <input
            type="text"
            class="search-input"
            placeholder="Search products..."
            [(ngModel)]="searchQuery"
          />
          <button class="btn btn-primary" (click)="openProductModal()">+ Add Product</button>
        </div>
      </div>

      <!-- Products Grid/Table -->
      <div class="card">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Product Name</th>
                <th>Engineering Description</th>
                <th>Selling Price</th>
                <th>UoM</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (p of filteredProducts(); track p.id) {
                <tr>
                  <td><strong>{{ p.productCode }}</strong></td>
                  <td><strong>{{ p.name }}</strong></td>
                  <td>{{ p.description }}</td>
                  <td>₹{{ p.unitPrice | number:'1.2-2' }}</td>
                  <td>{{ p.unitOfMeasure }}</td>
                  <td>
                    <span class="badge" [ngClass]="p.active ? 'badge-success' : 'badge-danger'">
                      {{ p.active ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td>
                    <div style="display: flex; gap: 6px;">
                      <button class="btn btn-primary btn-sm" (click)="viewBom(p)">BOM Recipe</button>
                      <button class="btn btn-secondary btn-sm" (click)="editProduct(p)">Edit</button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="7" style="text-align: center; color: #94a3b8; padding: 24px;">No products found</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- BOM Drawer / Section -->
      @if (selectedProduct) {
        <div class="card" style="border: 2px solid #3b82f6;">
          <div class="card-header">
            <div>
              <h3>Bill of Materials: {{ selectedProduct.name }} ({{ selectedProduct.productCode }})</h3>
              <p style="font-size: 13px; color: #64748b; margin-top: 4px;">
                Required raw material components and scrap allowances to produce 1 unit
              </p>
            </div>
            <div style="display: flex; gap: 10px;">
              <button class="btn btn-primary btn-sm" (click)="openAddBomModal()">+ Add Component</button>
              <button class="btn btn-secondary btn-sm" (click)="selectedProduct = null">Close</button>
            </div>
          </div>

          <!-- Requirements Simulator -->
          <div style="background: #f8fafc; padding: 14px 20px; border-radius: 8px; margin-bottom: 20px; display: flex; align-items: center; gap: 16px;">
            <span style="font-size: 13px; font-weight: 600;">Simulate Order Production Batch:</span>
            <input type="number" [(ngModel)]="simulateQty" min="1" style="width: 90px; padding: 6px; border: 1px solid #cbd5e1; border-radius: 6px;" />
            <button class="btn btn-secondary btn-sm" (click)="calculateShortages()">Simulate Availability</button>
          </div>

          @if (requirementsCheck.length > 0) {
            <div style="margin-bottom: 20px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; background: #fff;">
              <h4 style="margin-bottom: 12px; font-size: 14px;">Material Requirement Check (Batch Qty: {{ simulateQty }})</h4>
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Material</th>
                    <th>Required for Batch</th>
                    <th>Warehouse Stock</th>
                    <th>Deficit</th>
                    <th>Feasibility</th>
                  </tr>
                </thead>
                <tbody>
                  @for (req of requirementsCheck; track req.rawMaterialId) {
                    <tr>
                      <td><strong>{{ req.rawMaterialName }}</strong> ({{ req.rawMaterialCode }})</td>
                      <td>{{ req.quantityNeeded }} {{ req.unitOfMeasure }}</td>
                      <td>{{ req.currentStock }} {{ req.unitOfMeasure }}</td>
                      <td [style.color]="req.shortageQuantity > 0 ? '#ef4444' : '#64748b'" [style.font-weight]="req.shortageQuantity > 0 ? 'bold' : 'normal'">
                        {{ req.shortageQuantity }} {{ req.unitOfMeasure }}
                      </td>
                      <td>
                        <span class="badge" [ngClass]="req.hasSufficientStock ? 'badge-success' : 'badge-danger'">
                          {{ req.hasSufficientStock ? 'SUFFICIENT' : 'SHORTAGE' }}
                        </span>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }

          <!-- BOM Items Table -->
          <table class="data-table">
            <thead>
              <tr>
                <th>Component Code</th>
                <th>Material Name</th>
                <th>Quantity Required</th>
                <th>Scrap Allowance (%)</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (item of bomItems; track item.id) {
                <tr>
                  <td><strong>{{ item.rawMaterialCode }}</strong></td>
                  <td>{{ item.rawMaterialName }}</td>
                  <td>{{ item.quantityRequired }} {{ item.unitOfMeasure }}</td>
                  <td>{{ item.scrapPercentage || 0 }}%</td>
                  <td>{{ item.notes || '-' }}</td>
                  <td>
                    <button class="btn btn-danger btn-sm" (click)="deleteBomItem(item.id!)">Remove</button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" style="text-align: center; color: #94a3b8; padding: 24px;">No BOM components defined yet.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- Add Product Modal -->
      @if (showProductModal) {
        <div class="modal-overlay">
          <div class="modal-content">
            <div class="modal-header">
              <h3>{{ editingProduct?.id ? 'Edit Product' : 'Add Manufactured Product' }}</h3>
              <button class="close-btn" (click)="showProductModal = false">&times;</button>
            </div>
            <form (ngSubmit)="saveProduct()">
              <div class="form-group">
                <label>Product Code *</label>
                <input type="text" [(ngModel)]="currentProduct.productCode" name="code" required />
              </div>
              <div class="form-group">
                <label>Product Name *</label>
                <input type="text" [(ngModel)]="currentProduct.name" name="name" required />
              </div>
              <div class="form-group">
                <label>Description *</label>
                <textarea [(ngModel)]="currentProduct.description" name="desc" rows="2" required></textarea>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                <div class="form-group">
                  <label>Unit of Measure *</label>
                  <input type="text" [(ngModel)]="currentProduct.unitOfMeasure" name="uom" placeholder="e.g. UNIT, SET" required />
                </div>
                <div class="form-group">
                  <label>Selling Price ($) *</label>
                  <input type="number" step="0.01" [(ngModel)]="currentProduct.unitPrice" name="price" required />
                </div>
              </div>
              <div class="modal-actions">
                <button type="button" class="btn btn-secondary" (click)="showProductModal = false">Cancel</button>
                <button type="submit" class="btn btn-primary">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Add BOM Component Modal -->
      @if (showBomModal) {
        <div class="modal-overlay">
          <div class="modal-content">
            <div class="modal-header">
              <h3>Add Raw Material to BOM</h3>
              <button class="close-btn" (click)="showBomModal = false">&times;</button>
            </div>
            <form (ngSubmit)="saveBomItem()">
              <div class="form-group">
                <label>Select Raw Material *</label>
                <select [(ngModel)]="newBomItem.rawMaterialId" name="materialId" required>
                  <option [ngValue]="null" disabled>Choose a material...</option>
                  @for (rm of rawMaterials; track rm.id) {
                    <option [value]="rm.id">{{ rm.name }} ({{ rm.materialCode }} - {{ rm.unitOfMeasure }})</option>
                  }
                </select>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                <div class="form-group">
                  <label>Quantity Required per Unit *</label>
                  <input type="number" step="0.001" [(ngModel)]="newBomItem.quantityRequired" name="qty" required />
                </div>
                <div class="form-group">
                  <label>Scrap Allowance (%)</label>
                  <input type="number" step="0.1" [(ngModel)]="newBomItem.scrapPercentage" name="scrap" />
                </div>
              </div>
              <div class="form-group">
                <label>Engineering Notes</label>
                <input type="text" [(ngModel)]="newBomItem.notes" name="notes" placeholder="e.g. Primary structural casing" />
              </div>
              <div class="modal-actions">
                <button type="button" class="btn btn-secondary" (click)="showBomModal = false">Cancel</button>
                <button type="submit" class="btn btn-primary">Add to BOM</button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `
})
export class ProductsComponent implements OnInit {
  products: Product[] = [];
  rawMaterials: RawMaterial[] = [];
  searchQuery = '';
  selectedProduct: Product | null = null;
  bomItems: BomItem[] = [];

  showProductModal = false;
  editingProduct: Product | null = null;
  currentProduct: Product = this.resetProduct();

  showBomModal = false;
  newBomItem: any = {};
  simulateQty = 10;
  requirementsCheck: MaterialRequirement[] = [];

  constructor(
    private api: ApiService,
    private notify: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadProducts();
    this.api.getRawMaterials().subscribe({
      next: (data) => (this.rawMaterials = data)
    });
  }

  loadProducts(): void {
    this.api.getProducts().subscribe({
      next: (data) => (this.products = data),
      error: () => this.notify.error('Could not load products')
    });
  }

  filteredProducts(): Product[] {
    if (!this.searchQuery) return this.products;
    const q = this.searchQuery.toLowerCase();
    return this.products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.productCode.toLowerCase().includes(q)
    );
  }

  viewBom(p: Product): void {
    this.selectedProduct = p;
    this.requirementsCheck = [];
    this.loadBom(p.id!);
  }

  loadBom(productId: number): void {
    this.api.getBomByProduct(productId).subscribe({
      next: (items) => (this.bomItems = items)
    });
  }

  calculateShortages(): void {
    if (!this.selectedProduct?.id) return;
    this.api.calculateRequirements(this.selectedProduct.id, this.simulateQty).subscribe({
      next: (reqs) => {
        this.requirementsCheck = reqs;
        this.notify.info(`Requirement check calculated for ${this.simulateQty} units`);
      },
      error: (err) => this.notify.error(err.error?.message || 'Feasibility check failed')
    });
  }

  openProductModal(): void {
    this.editingProduct = null;
    this.currentProduct = this.resetProduct();
    this.showProductModal = true;
  }

  editProduct(p: Product): void {
    this.editingProduct = p;
    this.currentProduct = { ...p };
    this.showProductModal = true;
  }

  saveProduct(): void {
    if (this.editingProduct?.id) {
      this.api.updateProduct(this.editingProduct.id, this.currentProduct).subscribe({
        next: () => {
          this.notify.success('Product details updated');
          this.loadProducts();
          this.showProductModal = false;
        },
        error: (err) => this.notify.error(err.error?.message || 'Update failed')
      });
    } else {
      this.api.createProduct(this.currentProduct).subscribe({
        next: () => {
          this.notify.success('Manufactured product created');
          this.loadProducts();
          this.showProductModal = false;
        },
        error: (err) => this.notify.error(err.error?.message || 'Creation failed')
      });
    }
  }

  openAddBomModal(): void {
    this.newBomItem = {
      productId: this.selectedProduct?.id,
      rawMaterialId: null,
      quantityRequired: 1,
      scrapPercentage: 0,
      notes: ''
    };
    this.showBomModal = true;
  }

  saveBomItem(): void {
    this.api.addBomItem(this.newBomItem).subscribe({
      next: () => {
        this.notify.success('Raw material component added to BOM');
        this.loadBom(this.selectedProduct!.id!);
        this.showBomModal = false;
      },
      error: (err) => this.notify.error(err.error?.message || 'Failed to add BOM item')
    });
  }

  deleteBomItem(id: number): void {
    this.api.deleteBomItem(id).subscribe({
      next: () => {
        this.notify.info('BOM component removed');
        this.loadBom(this.selectedProduct!.id!);
      },
      error: () => this.notify.error('Could not remove BOM component')
    });
  }

  private resetProduct(): Product {
    return {
      productCode: '',
      name: '',
      description: '',
      unitOfMeasure: 'UNIT',
      unitPrice: 0,
      active: true
    };
  }
}
