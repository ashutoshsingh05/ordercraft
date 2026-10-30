package com.ordercraft.dto;

import java.math.BigDecimal;

public class MonthlySalesDto {
    private String month; // e.g. "Jan 2026"
    private BigDecimal revenue = BigDecimal.ZERO;
    private long orderCount = 0;

    public MonthlySalesDto() {}

    public MonthlySalesDto(String month, BigDecimal revenue, long orderCount) {
        this.month = month;
        this.revenue = revenue != null ? revenue : BigDecimal.ZERO;
        this.orderCount = orderCount;
    }

    public String getMonth() { return month; }
    public void setMonth(String month) { this.month = month; }

    public BigDecimal getRevenue() { return revenue; }
    public void setRevenue(BigDecimal revenue) { this.revenue = revenue; }

    public long getOrderCount() { return orderCount; }
    public void setOrderCount(long orderCount) { this.orderCount = orderCount; }
}
