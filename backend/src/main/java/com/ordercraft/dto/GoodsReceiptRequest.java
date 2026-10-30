package com.ordercraft.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.List;

public class GoodsReceiptRequest {
    @NotNull(message = "Purchase order ID is required")
    private Long purchaseOrderId;

    private LocalDate receiptDate = LocalDate.now();
    private String notes;

    @NotEmpty(message = "Receipt must contain at least one item")
    @Valid
    private List<GoodsReceiptItemRequest> items;

    public GoodsReceiptRequest() {}

    public Long getPurchaseOrderId() { return purchaseOrderId; }
    public void setPurchaseOrderId(Long purchaseOrderId) { this.purchaseOrderId = purchaseOrderId; }

    public LocalDate getReceiptDate() { return receiptDate; }
    public void setReceiptDate(LocalDate receiptDate) { this.receiptDate = receiptDate; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public List<GoodsReceiptItemRequest> getItems() { return items; }
    public void setItems(List<GoodsReceiptItemRequest> items) { this.items = items; }
}
