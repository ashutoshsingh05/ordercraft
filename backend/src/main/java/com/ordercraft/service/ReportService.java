package com.ordercraft.service;

import com.ordercraft.entity.*;
import com.ordercraft.repository.*;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;

@Service
public class ReportService {

    private final CustomerOrderRepository orderRepository;
    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;
    private final RawMaterialRepository rawMaterialRepository;
    private final PurchaseOrderRepository poRepository;

    public ReportService(CustomerOrderRepository orderRepository,
                         InvoiceRepository invoiceRepository,
                         PaymentRepository paymentRepository,
                         RawMaterialRepository rawMaterialRepository,
                         PurchaseOrderRepository poRepository) {
        this.orderRepository = orderRepository;
        this.invoiceRepository = invoiceRepository;
        this.paymentRepository = paymentRepository;
        this.rawMaterialRepository = rawMaterialRepository;
        this.poRepository = poRepository;
    }

    public byte[] generateOrdersCsv(LocalDate start, LocalDate end) {
        List<CustomerOrder> orders = (start != null && end != null)
                ? orderRepository.findOrdersBetween(start, end)
                : orderRepository.findAll();

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try (PrintWriter writer = new PrintWriter(out, true, StandardCharsets.UTF_8)) {
            writer.println("Order Number,Customer Code,Customer Name,Order Date,Delivery Date,Status,Total Amount,Invoiced");
            for (CustomerOrder o : orders) {
                writer.printf("\"%s\",\"%s\",\"%s\",%s,%s,\"%s\",%s,%s%n",
                        o.getOrderNumber(),
                        o.getCustomer().getCustomerCode(),
                        o.getCustomer().getName().replace("\"", "\"\""),
                        o.getOrderDate(),
                        o.getDeliveryDate() != null ? o.getDeliveryDate() : "",
                        o.getStatus(),
                        o.getTotalAmount(),
                        o.isInvoiced());
            }
        }
        return out.toByteArray();
    }

    public byte[] generateInvoicesCsv(LocalDate start, LocalDate end) {
        List<Invoice> invoices = (start != null && end != null)
                ? invoiceRepository.findInvoicesBetween(start, end)
                : invoiceRepository.findAll();

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try (PrintWriter writer = new PrintWriter(out, true, StandardCharsets.UTF_8)) {
            writer.println("Invoice Number,Customer Name,Issue Date,Due Date,Status,Subtotal,Tax Amount,Total Amount,Paid Amount,Balance Due");
            for (Invoice i : invoices) {
                writer.printf("\"%s\",\"%s\",%s,%s,\"%s\",%s,%s,%s,%s,%s%n",
                        i.getInvoiceNumber(),
                        i.getCustomer().getName().replace("\"", "\"\""),
                        i.getIssueDate(),
                        i.getDueDate(),
                        i.getStatus(),
                        i.getSubtotal(),
                        i.getTaxAmount(),
                        i.getTotalAmount(),
                        i.getPaidAmount(),
                        i.getBalanceDue());
            }
        }
        return out.toByteArray();
    }

    public byte[] generateInventoryCsv() {
        List<RawMaterial> materials = rawMaterialRepository.findAll();

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try (PrintWriter writer = new PrintWriter(out, true, StandardCharsets.UTF_8)) {
            writer.println("Material Code,Name,Unit,Unit Cost,Current Stock,Min Stock,Reorder Level,Low Stock Alert");
            for (RawMaterial m : materials) {
                writer.printf("\"%s\",\"%s\",\"%s\",%s,%s,%s,%s,%s%n",
                        m.getMaterialCode(),
                        m.getName().replace("\"", "\"\""),
                        m.getUnitOfMeasure(),
                        m.getUnitCost(),
                        m.getCurrentStock(),
                        m.getMinStockLevel(),
                        m.getReorderLevel(),
                        m.isLowStock() ? "YES" : "NO");
            }
        }
        return out.toByteArray();
    }

    public byte[] generatePaymentsCsv(LocalDate start, LocalDate end) {
        List<Payment> payments = (start != null && end != null)
                ? paymentRepository.findPaymentsBetween(start, end)
                : paymentRepository.findAll();

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try (PrintWriter writer = new PrintWriter(out, true, StandardCharsets.UTF_8)) {
            writer.println("Payment Number,Invoice Number,Customer Name,Payment Date,Payment Method,Amount,Reference Number,Recorded By");
            for (Payment p : payments) {
                writer.printf("\"%s\",\"%s\",\"%s\",%s,\"%s\",%s,\"%s\",\"%s\"%n",
                        p.getPaymentNumber(),
                        p.getInvoice().getInvoiceNumber(),
                        p.getInvoice().getCustomer().getName().replace("\"", "\"\""),
                        p.getPaymentDate(),
                        p.getPaymentMethod(),
                        p.getAmount(),
                        p.getReferenceNumber() != null ? p.getReferenceNumber().replace("\"", "\"\"") : "",
                        p.getRecordedBy() != null ? p.getRecordedBy() : "");
            }
        }
        return out.toByteArray();
    }
}
