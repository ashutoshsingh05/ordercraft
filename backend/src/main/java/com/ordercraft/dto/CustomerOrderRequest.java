package com.ordercraft.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.List;

public class CustomerOrderRequest {
    @NotNull(message = "Customer ID is required")
    private Long customerId;

    private LocalDate orderDate = LocalDate.now();
    private LocalDate deliveryDate;
    private String notes;

    @NotEmpty(message = "Order must contain at least one item")
    @Valid
    private List<CustomerOrderItemRequest> items;

    public CustomerOrderRequest() {}

    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }

    public LocalDate getOrderDate() { return orderDate; }
    public void setOrderDate(LocalDate orderDate) { this.orderDate = orderDate; }

    public LocalDate getDeliveryDate() { return deliveryDate; }
    public void setDeliveryDate(LocalDate deliveryDate) { this.deliveryDate = deliveryDate; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public List<CustomerOrderItemRequest> getItems() { return items; }
    public void setItems(List<CustomerOrderItemRequest> items) { this.items = items; }
}
