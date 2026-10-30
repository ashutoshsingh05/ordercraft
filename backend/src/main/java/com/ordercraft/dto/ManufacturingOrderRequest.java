package com.ordercraft.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

public class ManufacturingOrderRequest {
    private Long customerOrderId;

    @NotNull(message = "Product ID is required")
    private Long productId;

    @NotNull(message = "Target quantity is required")
    @DecimalMin(value = "0.01", message = "Target quantity must be greater than zero")
    private BigDecimal targetQuantity;

    private LocalDate startDate = LocalDate.now();
    private String notes;

    public ManufacturingOrderRequest() {}

    public Long getCustomerOrderId() { return customerOrderId; }
    public void setCustomerOrderId(Long customerOrderId) { this.customerOrderId = customerOrderId; }

    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }

    public BigDecimal getTargetQuantity() { return targetQuantity; }
    public void setTargetQuantity(BigDecimal targetQuantity) { this.targetQuantity = targetQuantity; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
