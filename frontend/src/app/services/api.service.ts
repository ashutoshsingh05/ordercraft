import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Customer,
  Supplier,
  Product,
  RawMaterial,
  BomItem,
  CustomerOrder,
  ManufacturingOrder,
  MaterialRequirement,
  PurchaseOrder,
  GoodsReceipt,
  Invoice,
  Payment,
  DashboardStats,
  InventoryTransaction
} from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Dashboard
  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.base}/dashboard/stats`);
  }

  // Customers
  getCustomers(): Observable<Customer[]> {
    return this.http.get<Customer[]>(`${this.base}/customers`);
  }
  getCustomer(id: number): Observable<Customer> {
    return this.http.get<Customer>(`${this.base}/customers/${id}`);
  }
  createCustomer(c: Customer): Observable<Customer> {
    return this.http.post<Customer>(`${this.base}/customers`, c);
  }
  updateCustomer(id: number, c: Customer): Observable<Customer> {
    return this.http.put<Customer>(`${this.base}/customers/${id}`, c);
  }
  deleteCustomer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/customers/${id}`);
  }

  // Suppliers
  getSuppliers(): Observable<Supplier[]> {
    return this.http.get<Supplier[]>(`${this.base}/suppliers`);
  }
  getSupplier(id: number): Observable<Supplier> {
    return this.http.get<Supplier>(`${this.base}/suppliers/${id}`);
  }
  createSupplier(s: Supplier): Observable<Supplier> {
    return this.http.post<Supplier>(`${this.base}/suppliers`, s);
  }
  updateSupplier(id: number, s: Supplier): Observable<Supplier> {
    return this.http.put<Supplier>(`${this.base}/suppliers/${id}`, s);
  }
  deleteSupplier(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/suppliers/${id}`);
  }

  // Products
  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.base}/products`);
  }
  getProduct(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.base}/products/${id}`);
  }
  createProduct(p: Product): Observable<Product> {
    return this.http.post<Product>(`${this.base}/products`, p);
  }
  updateProduct(id: number, p: Product): Observable<Product> {
    return this.http.put<Product>(`${this.base}/products/${id}`, p);
  }
  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/products/${id}`);
  }

  // Raw Materials
  getRawMaterials(): Observable<RawMaterial[]> {
    return this.http.get<RawMaterial[]>(`${this.base}/raw-materials`);
  }
  getRawMaterial(id: number): Observable<RawMaterial> {
    return this.http.get<RawMaterial>(`${this.base}/raw-materials/${id}`);
  }
  createRawMaterial(m: RawMaterial): Observable<RawMaterial> {
    return this.http.post<RawMaterial>(`${this.base}/raw-materials`, m);
  }
  updateRawMaterial(id: number, m: RawMaterial): Observable<RawMaterial> {
    return this.http.put<RawMaterial>(`${this.base}/raw-materials/${id}`, m);
  }
  deleteRawMaterial(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/raw-materials/${id}`);
  }
  adjustStock(id: number, req: { adjustmentType: string; quantity: number; notes: string }): Observable<RawMaterial> {
    return this.http.post<RawMaterial>(`${this.base}/raw-materials/${id}/adjust-stock`, req);
  }
  getMaterialTransactions(id: number): Observable<InventoryTransaction[]> {
    return this.http.get<InventoryTransaction[]>(`${this.base}/raw-materials/${id}/transactions`);
  }

  // BOM
  getBomByProduct(productId: number): Observable<BomItem[]> {
    return this.http.get<BomItem[]>(`${this.base}/bom/product/${productId}`);
  }
  addBomItem(item: BomItem): Observable<BomItem> {
    return this.http.post<BomItem>(`${this.base}/bom`, item);
  }
  deleteBomItem(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/bom/${id}`);
  }
  calculateRequirements(productId: number, quantity: number): Observable<MaterialRequirement[]> {
    return this.http.get<MaterialRequirement[]>(`${this.base}/bom/product/${productId}/requirements?quantity=${quantity}`);
  }

  // Customer Orders
  getOrders(): Observable<CustomerOrder[]> {
    return this.http.get<CustomerOrder[]>(`${this.base}/orders`);
  }
  getOrder(id: number): Observable<CustomerOrder> {
    return this.http.get<CustomerOrder>(`${this.base}/orders/${id}`);
  }
  createOrder(order: any): Observable<CustomerOrder> {
    return this.http.post<CustomerOrder>(`${this.base}/orders`, order);
  }
  updateOrderStatus(id: number, status: string, notes?: string): Observable<CustomerOrder> {
    return this.http.patch<CustomerOrder>(`${this.base}/orders/${id}/status`, { status, notes });
  }

  // Manufacturing Orders
  getManufacturingOrders(): Observable<ManufacturingOrder[]> {
    return this.http.get<ManufacturingOrder[]>(`${this.base}/manufacturing`);
  }
  getManufacturingOrder(id: number): Observable<ManufacturingOrder> {
    return this.http.get<ManufacturingOrder>(`${this.base}/manufacturing/${id}`);
  }
  createManufacturingOrder(req: any): Observable<ManufacturingOrder> {
    return this.http.post<ManufacturingOrder>(`${this.base}/manufacturing`, req);
  }
  startProduction(id: number): Observable<ManufacturingOrder> {
    return this.http.post<ManufacturingOrder>(`${this.base}/manufacturing/${id}/start`, {});
  }
  completeProduction(id: number): Observable<ManufacturingOrder> {
    return this.http.post<ManufacturingOrder>(`${this.base}/manufacturing/${id}/complete`, {});
  }
  checkMoShortages(id: number): Observable<MaterialRequirement[]> {
    return this.http.get<MaterialRequirement[]>(`${this.base}/manufacturing/${id}/shortages`);
  }

  // Purchase Orders
  getPurchaseOrders(): Observable<PurchaseOrder[]> {
    return this.http.get<PurchaseOrder[]>(`${this.base}/purchase-orders`);
  }
  getPurchaseOrder(id: number): Observable<PurchaseOrder> {
    return this.http.get<PurchaseOrder>(`${this.base}/purchase-orders/${id}`);
  }
  createPurchaseOrder(po: any): Observable<PurchaseOrder> {
    return this.http.post<PurchaseOrder>(`${this.base}/purchase-orders`, po);
  }
  submitPurchaseOrder(id: number): Observable<PurchaseOrder> {
    return this.http.patch<PurchaseOrder>(`${this.base}/purchase-orders/${id}/submit`, {});
  }
  receiveGoods(id: number, receipt: any): Observable<GoodsReceipt> {
    return this.http.post<GoodsReceipt>(`${this.base}/purchase-orders/${id}/receipts`, receipt);
  }

  // Invoices
  getInvoices(): Observable<Invoice[]> {
    return this.http.get<Invoice[]>(`${this.base}/invoices`);
  }
  getInvoice(id: number): Observable<Invoice> {
    return this.http.get<Invoice>(`${this.base}/invoices/${id}`);
  }
  createInvoiceFromOrder(customerOrderId: number, taxRate: number = 0.05, paymentTermsDays: number = 30): Observable<Invoice> {
    return this.http.post<Invoice>(`${this.base}/invoices/from-order/${customerOrderId}`, {
      taxRate,
      paymentTermsDays
    });
  }

  // Payments
  getPayments(): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.base}/payments`);
  }
  recordPayment(payment: any): Observable<Payment> {
    return this.http.post<Payment>(`${this.base}/payments`, payment);
  }

  // CSV Exports
  exportOrdersUrl(): string {
    return `${this.base}/reports/orders/export`;
  }
  exportInvoicesUrl(): string {
    return `${this.base}/reports/invoices/export`;
  }
  exportInventoryUrl(): string {
    return `${this.base}/reports/inventory/export`;
  }
  exportPaymentsUrl(): string {
    return `${this.base}/reports/payments/export`;
  }
}
