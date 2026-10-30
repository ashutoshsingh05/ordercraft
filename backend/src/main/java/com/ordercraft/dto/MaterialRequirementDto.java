package com.ordercraft.dto;

import java.math.BigDecimal;

public class MaterialRequirementDto {
    private Long rawMaterialId;
    private String materialCode;
    private String materialName;
    private String unitOfMeasure;
    private BigDecimal requiredQuantity;
    private BigDecimal availableStock;
    private boolean shortage;
    private BigDecimal shortageQuantity;

    public MaterialRequirementDto() {}

    public MaterialRequirementDto(Long rawMaterialId, String materialCode, String materialName, String unitOfMeasure,
                                  BigDecimal requiredQuantity, BigDecimal availableStock) {
        this.rawMaterialId = rawMaterialId;
        this.materialCode = materialCode;
        this.materialName = materialName;
        this.unitOfMeasure = unitOfMeasure;
        this.requiredQuantity = requiredQuantity;
        this.availableStock = availableStock;
        if (availableStock.compareTo(requiredQuantity) < 0) {
            this.shortage = true;
            this.shortageQuantity = requiredQuantity.subtract(availableStock);
        } else {
            this.shortage = false;
            this.shortageQuantity = BigDecimal.ZERO;
        }
    }

    public Long getRawMaterialId() { return rawMaterialId; }
    public void setRawMaterialId(Long rawMaterialId) { this.rawMaterialId = rawMaterialId; }

    public String getMaterialCode() { return materialCode; }
    public void setMaterialCode(String materialCode) { this.materialCode = materialCode; }

    public String getMaterialName() { return materialName; }
    public void setMaterialName(String materialName) { this.materialName = materialName; }

    public String getUnitOfMeasure() { return unitOfMeasure; }
    public void setUnitOfMeasure(String unitOfMeasure) { this.unitOfMeasure = unitOfMeasure; }

    public BigDecimal getRequiredQuantity() { return requiredQuantity; }
    public void setRequiredQuantity(BigDecimal requiredQuantity) { this.requiredQuantity = requiredQuantity; }

    public BigDecimal getAvailableStock() { return availableStock; }
    public void setAvailableStock(BigDecimal availableStock) { this.availableStock = availableStock; }

    public boolean isShortage() { return shortage; }
    public void setShortage(boolean shortage) { this.shortage = shortage; }

    public BigDecimal getShortageQuantity() { return shortageQuantity; }
    public void setShortageQuantity(BigDecimal shortageQuantity) { this.shortageQuantity = shortageQuantity; }
}
