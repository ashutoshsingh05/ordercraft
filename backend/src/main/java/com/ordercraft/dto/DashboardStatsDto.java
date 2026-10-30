package com.ordercraft.dto;

import com.ordercraft.entity.CustomerOrder;
import com.ordercraft.entity.RawMaterial;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public class DashboardStatsDto {
    private long totalOrders;
    private long pendingOrders;
    private long inProductionOrders;
    private long completedOrders;

    private BigDecimal totalInvoicedAmount;
    private BigDecimal outstandingPayments;
    private BigDecimal totalRevenueCollected;

    private long lowStockCount;
    private List<RawMaterial> lowStockMaterials;
    private List<CustomerOrder> recentOrders;

    private Map<String, Long> orderStatusDistribution;
    private List<MonthlySalesDto> monthlySales;

    public DashboardStatsDto() {}

    public long getTotalOrders() { return totalOrders; }
    public void setTotalOrders(long totalOrders) { this.totalOrders = totalOrders; }

    public long getPendingOrders() { return pendingOrders; }
    public void setPendingOrders(long pendingOrders) { this.pendingOrders = pendingOrders; }

    public long getInProductionOrders() { return inProductionOrders; }
    public void setInProductionOrders(long inProductionOrders) { this.inProductionOrders = inProductionOrders; }

    public long getCompletedOrders() { return completedOrders; }
    public void setCompletedOrders(long completedOrders) { this.completedOrders = completedOrders; }

    public BigDecimal getTotalInvoicedAmount() { return totalInvoicedAmount; }
    public void setTotalInvoicedAmount(BigDecimal totalInvoicedAmount) { this.totalInvoicedAmount = totalInvoicedAmount; }

    public BigDecimal getOutstandingPayments() { return outstandingPayments; }
    public void setOutstandingPayments(BigDecimal outstandingPayments) { this.outstandingPayments = outstandingPayments; }

    public BigDecimal getTotalRevenueCollected() { return totalRevenueCollected; }
    public void setTotalRevenueCollected(BigDecimal totalRevenueCollected) { this.totalRevenueCollected = totalRevenueCollected; }

    public long getLowStockCount() { return lowStockCount; }
    public void setLowStockCount(long lowStockCount) { this.lowStockCount = lowStockCount; }

    public List<RawMaterial> getLowStockMaterials() { return lowStockMaterials; }
    public void setLowStockMaterials(List<RawMaterial> lowStockMaterials) { this.lowStockMaterials = lowStockMaterials; }

    public List<CustomerOrder> getRecentOrders() { return recentOrders; }
    public void setRecentOrders(List<CustomerOrder> recentOrders) { this.recentOrders = recentOrders; }

    public Map<String, Long> getOrderStatusDistribution() { return orderStatusDistribution; }
    public void setOrderStatusDistribution(Map<String, Long> orderStatusDistribution) { this.orderStatusDistribution = orderStatusDistribution; }

    public List<MonthlySalesDto> getMonthlySales() { return monthlySales; }
    public void setMonthlySales(List<MonthlySalesDto> monthlySales) { this.monthlySales = monthlySales; }
}
