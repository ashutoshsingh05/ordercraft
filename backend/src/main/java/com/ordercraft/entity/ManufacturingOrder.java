package com.ordercraft.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "manufacturing_orders")
public class ManufacturingOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "mo_number", nullable = false, unique = true, length = 40)
    private String moNumber;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "customer_order_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "items"})
    private CustomerOrder customerOrder;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Product product;

    @Column(name = "target_quantity", nullable = false, precision = 12, scale = 2)
    private BigDecimal targetQuantity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ManufacturingStatus status = ManufacturingStatus.PLANNED;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "completion_date")
    private LocalDate completionDate;

    @Column(name = "materials_issued", nullable = false)
    private boolean materialsIssued = false;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    public ManufacturingOrder() {}

    public ManufacturingOrder(String moNumber, CustomerOrder customerOrder, Product product, BigDecimal targetQuantity, LocalDate startDate, String notes) {
        this.moNumber = moNumber;
        this.customerOrder = customerOrder;
        this.product = product;
        this.targetQuantity = targetQuantity;
        this.startDate = startDate != null ? startDate : LocalDate.now();
        this.notes = notes;
        this.status = ManufacturingStatus.PLANNED;
        this.materialsIssued = false;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getMoNumber() { return moNumber; }
    public void setMoNumber(String moNumber) { this.moNumber = moNumber; }

    public CustomerOrder getCustomerOrder() { return customerOrder; }
    public void setCustomerOrder(CustomerOrder customerOrder) { this.customerOrder = customerOrder; }

    public Product getProduct() { return product; }
    public void setProduct(Product product) { this.product = product; }

    public BigDecimal getTargetQuantity() { return targetQuantity; }
    public void setTargetQuantity(BigDecimal targetQuantity) { this.targetQuantity = targetQuantity; }

    public ManufacturingStatus getStatus() { return status; }
    public void setStatus(ManufacturingStatus status) { this.status = status; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getCompletionDate() { return completionDate; }
    public void setCompletionDate(LocalDate completionDate) { this.completionDate = completionDate; }

    public boolean isMaterialsIssued() { return materialsIssued; }
    public void setMaterialsIssued(boolean materialsIssued) { this.materialsIssued = materialsIssued; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
