package com.ordercraft.service;

import com.ordercraft.dto.DashboardStatsDto;
import com.ordercraft.dto.MonthlySalesDto;
import com.ordercraft.entity.CustomerOrder;
import com.ordercraft.entity.CustomerOrderStatus;
import com.ordercraft.entity.Invoice;
import com.ordercraft.entity.RawMaterial;
import com.ordercraft.repository.*;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class DashboardService {

    private final CustomerOrderRepository orderRepository;
    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;
    private final RawMaterialRepository rawMaterialRepository;

    public DashboardService(CustomerOrderRepository orderRepository,
                            InvoiceRepository invoiceRepository,
                            PaymentRepository paymentRepository,
                            RawMaterialRepository rawMaterialRepository) {
        this.orderRepository = orderRepository;
        this.invoiceRepository = invoiceRepository;
        this.paymentRepository = paymentRepository;
        this.rawMaterialRepository = rawMaterialRepository;
    }

    public DashboardStatsDto getDashboardStats() {
        DashboardStatsDto stats = new DashboardStatsDto();

        // 1. Order counts
        stats.setTotalOrders(orderRepository.count());
        stats.setPendingOrders(orderRepository.countByStatus(CustomerOrderStatus.PENDING));
        stats.setInProductionOrders(orderRepository.countByStatus(CustomerOrderStatus.IN_PRODUCTION));
        stats.setCompletedOrders(orderRepository.countByStatus(CustomerOrderStatus.COMPLETED));

        // 2. Financial totals from database
        stats.setTotalInvoicedAmount(invoiceRepository.sumTotalInvoicedAmount());
        stats.setOutstandingPayments(invoiceRepository.sumOutstandingPayments());
        stats.setTotalRevenueCollected(paymentRepository.sumTotalCollected());

        // 3. Low stock raw materials
        List<RawMaterial> lowStock = rawMaterialRepository.findLowStockMaterials();
        stats.setLowStockMaterials(lowStock);
        stats.setLowStockCount(lowStock.size());

        // 4. Recent orders
        stats.setRecentOrders(orderRepository.findTop5ByOrderByCreatedAtDesc());

        // 5. Order status distribution
        Map<String, Long> statusDist = new LinkedHashMap<>();
        for (CustomerOrderStatus s : CustomerOrderStatus.values()) {
            statusDist.put(s.name(), orderRepository.countByStatus(s));
        }
        stats.setOrderStatusDistribution(statusDist);

        // 6. Monthly sales chart data (last 6 months)
        stats.setMonthlySales(calculateMonthlySales());

        return stats;
    }

    private List<MonthlySalesDto> calculateMonthlySales() {
        List<MonthlySalesDto> result = new ArrayList<>();
        LocalDate now = LocalDate.now();
        DateTimeFormatter monthFmt = DateTimeFormatter.ofPattern("MMM yyyy");

        for (int i = 5; i >= 0; i--) {
            LocalDate monthDate = now.minusMonths(i);
            LocalDate start = monthDate.withDayOfMonth(1);
            LocalDate end = monthDate.withDayOfMonth(monthDate.lengthOfMonth());

            List<Invoice> invoices = invoiceRepository.findInvoicesBetween(start, end);
            List<CustomerOrder> orders = orderRepository.findOrdersBetween(start, end);

            BigDecimal revenue = invoices.stream()
                    .map(Invoice::getTotalAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            result.add(new MonthlySalesDto(
                    start.format(monthFmt),
                    revenue,
                    orders.size()
            ));
        }

        return result;
    }
}
