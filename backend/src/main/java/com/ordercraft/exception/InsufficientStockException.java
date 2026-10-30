package com.ordercraft.exception;

import java.math.BigDecimal;

public class InsufficientStockException extends BusinessException {
    private final String materialCode;
    private final BigDecimal required;
    private final BigDecimal available;

    public InsufficientStockException(String materialCode, BigDecimal required, BigDecimal available) {
        super(String.format("Insufficient stock for material '%s'. Required: %s, Available: %s",
                materialCode, required.toString(), available.toString()));
        this.materialCode = materialCode;
        this.required = required;
        this.available = available;
    }

    public String getMaterialCode() { return materialCode; }
    public BigDecimal getRequired() { return required; }
    public BigDecimal getAvailable() { return available; }
}
