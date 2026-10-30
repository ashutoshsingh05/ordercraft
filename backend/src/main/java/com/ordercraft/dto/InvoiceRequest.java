package com.ordercraft.dto;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

public class InvoiceRequest {
    @NotNull(message = "Customer Order ID is required")
    private Long customerOrderId;

    private LocalDate issueDate = LocalDate.now();
    private LocalDate dueDate;
    private BigDecimal taxRate = BigDecimal.valueOf(10.00);
    private String notes;

    public InvoiceRequest() {}

    public Long getCustomerOrderId() { return customerOrderId; }
    public void setCustomerOrderId(Long customerOrderId) { this.customerOrderId = customerOrderId; }

    public LocalDate getIssueDate() { return issueDate; }
    public void setIssueDate(LocalDate issueDate) { this.issueDate = issueDate; }

    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }

    public BigDecimal getTaxRate() { return taxRate; }
    public void setTaxRate(BigDecimal taxRate) { this.taxRate = taxRate; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
