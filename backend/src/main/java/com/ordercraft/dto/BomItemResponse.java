package com.ordercraft.dto;

import java.math.BigDecimal;

public class BomItemResponse {
    private Long id;
    private Long productId;
    private String productCode;
    private String productName;
    private Long rawMaterialId;
    private String rawMaterialCode;
    private String rawMaterialName;
    private String unitOfMeasure;
    private BigDecimal quantityRequired;
    private BigDecimal scrapPercentage;
    private BigDecimal unitCost;
    private BigDecimal componentCost;
    private String notes;

    public BomItemResponse() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }

    public String getProductCode() { return productCode; }
    public void setProductCode(String productCode) { this.productCode = productCode; }

    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }

    public Long getRawMaterialId() { return rawMaterialId; }
    public void setRawMaterialId(Long rawMaterialId) { this.rawMaterialId = rawMaterialId; }

    public String getRawMaterialCode() { return rawMaterialCode; }
    public void setRawMaterialCode(String rawMaterialCode) { this.rawMaterialCode = rawMaterialCode; }

    public String getRawMaterialName() { return rawMaterialName; }
    public void setRawMaterialName(String rawMaterialName) { this.rawMaterialName = rawMaterialName; }

    public String getUnitOfMeasure() { return unitOfMeasure; }
    public void setUnitOfMeasure(String unitOfMeasure) { this.unitOfMeasure = unitOfMeasure; }

    public BigDecimal getQuantityRequired() { return quantityRequired; }
    public void setQuantityRequired(BigDecimal quantityRequired) { this.quantityRequired = quantityRequired; }

    public BigDecimal getScrapPercentage() { return scrapPercentage; }
    public void setScrapPercentage(BigDecimal scrapPercentage) { this.scrapPercentage = scrapPercentage; }

    public BigDecimal getUnitCost() { return unitCost; }
    public void setUnitCost(BigDecimal unitCost) { this.unitCost = unitCost; }

    public BigDecimal getComponentCost() { return componentCost; }
    public void setComponentCost(BigDecimal componentCost) { this.componentCost = componentCost; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
