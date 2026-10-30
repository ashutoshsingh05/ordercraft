package com.ordercraft.entity;

public enum InventoryTransactionType {
    RECEIPT,         // Received from Supplier / PO
    CONSUMPTION,     // Consumed in Manufacturing
    ADJUSTMENT,      // Stock adjustment / count correction
    RETURN           // Return to vendor or return from production
}
