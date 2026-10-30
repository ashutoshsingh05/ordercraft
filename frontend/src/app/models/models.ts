export interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
  role: 'ROLE_ADMIN' | 'ROLE_STAFF';
  token?: string;
}

export interface AuthResponse {
  token: string;
  type: string;
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: 'ROLE_ADMIN' | 'ROLE_STAFF';
}

export interface Customer {
  id?: number;
  customerCode: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  taxId?: string;
  active: boolean;
  createdAt?: string;
}

export interface Supplier {
  id?: number;
  supplierCode: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  paymentTerms?: string;
  leadTimeDays?: number;
  active: boolean;
  createdAt?: string;
}

export interface Product {
  id?: number;
  productCode: string;
  name: string;
  description: string;
  unitOfMeasure: string;
  unitPrice: number;
  active: boolean;
  createdAt?: string;
}

export interface RawMaterial {
  id?: number;
  materialCode: string;
  name: string;
  description: string;
  unitOfMeasure: string;
  unitCost: number;
  currentStock: number;
  minStockLevel: number;
  reorderLevel: number;
  active: boolean;
  lowStock?: boolean;
  createdAt?: string;
}

export interface BomItem {
  id?: number;
  productId: number;
  productName?: string;
  productCode?: string;
  rawMaterialId: number;
  rawMaterialName?: string;
  rawMaterialCode?: string;
  unitOfMeasure?: string;
  quantityRequired: number;
  scrapPercentage?: number;
  notes?: string;
}

export interface CustomerOrderItem {
  id?: number;
  productId: number;
  productName?: string;
  productCode?: string;
  quantity: number;
  unitPrice: number;
  subtotal?: number;
  notes?: string;
}

export interface CustomerOrder {
  id?: number;
  orderNumber?: string;
  customerId: number;
  customer?: Customer;
  orderDate: string;
  deliveryDate?: string;
  status: 'PENDING' | 'CONFIRMED' | 'IN_PRODUCTION' | 'COMPLETED' | 'DELIVERED' | 'CANCELLED';
  totalAmount?: number;
  invoiced?: boolean;
  notes?: string;
  items: CustomerOrderItem[];
  createdAt?: string;
}

export interface OrderStatusHistory {
  id: number;
  fromStatus: string;
  toStatus: string;
  changedBy: string;
  changeDate: string;
  reason?: string;
}

export interface ManufacturingOrder {
  id?: number;
  moNumber?: string;
  customerOrderId: number;
  customerOrderNumber?: string;
  customerName?: string;
  productId: number;
  productName?: string;
  productCode?: string;
  quantityToProduce: number;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  startDate?: string;
  completionDate?: string;
  notes?: string;
  materialsIssued?: boolean;
  createdAt?: string;
}

export interface MaterialRequirement {
  rawMaterialId: number;
  rawMaterialCode: string;
  rawMaterialName: string;
  unitOfMeasure: string;
  quantityNeeded: number;
  currentStock: number;
  shortageQuantity: number;
  hasSufficientStock: boolean;
}

export interface PurchaseOrderItem {
  id?: number;
  rawMaterialId: number;
  rawMaterialName?: string;
  rawMaterialCode?: string;
  unitOfMeasure?: string;
  quantity: number;
  unitPrice: number;
  subtotal?: number;
}

export interface PurchaseOrder {
  id?: number;
  poNumber?: string;
  supplierId: number;
  supplier?: Supplier;
  orderDate: string;
  expectedDeliveryDate?: string;
  status: 'DRAFT' | 'SUBMITTED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED';
  totalAmount?: number;
  notes?: string;
  items: PurchaseOrderItem[];
  createdAt?: string;
}

export interface GoodsReceiptItem {
  purchaseOrderItemId: number;
  rawMaterialId: number;
  rawMaterialName?: string;
  quantityReceived: number;
  unitPrice: number;
  notes?: string;
}

export interface GoodsReceipt {
  id?: number;
  receiptNumber?: string;
  purchaseOrderId: number;
  receiptDate: string;
  receivedBy?: string;
  notes?: string;
  items: GoodsReceiptItem[];
}

export interface InvoiceItem {
  id?: number;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Invoice {
  id?: number;
  invoiceNumber?: string;
  customerOrderId: number;
  customerOrderNumber?: string;
  customer?: Customer;
  invoiceDate: string;
  dueDate: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  outstandingBalance: number;
  status: 'DRAFT' | 'ISSUED' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  notes?: string;
  items: InvoiceItem[];
}

export interface Payment {
  id?: number;
  paymentNumber?: string;
  invoiceId: number;
  invoiceNumber?: string;
  amount: number;
  paymentDate: string;
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CREDIT_CARD' | 'CHECK';
  referenceNumber?: string;
  notes?: string;
}

export interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  inProductionOrders: number;
  completedOrders: number;
  totalInvoicedAmount: number;
  outstandingPayments: number;
  totalRevenueCollected: number;
  lowStockCount: number;
  lowStockMaterials: RawMaterial[];
  recentOrders: CustomerOrder[];
  orderStatusDistribution: Record<string, number>;
  monthlySales: { month: string; revenue: number; orderCount: number }[];
}

export interface InventoryTransaction {
  id: number;
  rawMaterialId: number;
  rawMaterialName?: string;
  transactionType: 'INITIAL' | 'PURCHASE_RECEIPT' | 'PRODUCTION_ISSUE' | 'ADJUSTMENT_ADD' | 'ADJUSTMENT_SUB';
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  referenceNumber?: string;
  notes?: string;
  createdAt: string;
}
