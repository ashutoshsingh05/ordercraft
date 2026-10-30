package com.ordercraft.service;

import com.ordercraft.dto.InvoiceRequest;
import com.ordercraft.entity.*;
import com.ordercraft.exception.BusinessException;
import com.ordercraft.exception.ResourceNotFoundException;
import com.ordercraft.repository.CustomerOrderRepository;
import com.ordercraft.repository.InvoiceRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final CustomerOrderRepository orderRepository;

    public InvoiceService(InvoiceRepository invoiceRepository, CustomerOrderRepository orderRepository) {
        this.invoiceRepository = invoiceRepository;
        this.orderRepository = orderRepository;
    }

    public Page<Invoice> getInvoices(InvoiceStatus status, String search, Pageable pageable) {
        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        return invoiceRepository.searchInvoices(status, cleanSearch, pageable);
    }

    public Invoice getInvoiceById(Long id) {
        return invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with id: " + id));
    }

    @Transactional
    public Invoice generateInvoiceFromOrder(InvoiceRequest request) {
        CustomerOrder order = orderRepository.findById(request.getCustomerOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer order not found with id: " + request.getCustomerOrderId()));

        if (order.isInvoiced()) {
            throw new BusinessException("An invoice has already been generated for order " + order.getOrderNumber());
        }

        if (order.getStatus() == CustomerOrderStatus.CANCELLED) {
            throw new BusinessException("Cannot generate an invoice for a cancelled order");
        }

        String invoiceNumber = generateInvoiceNumber();

        Invoice invoice = new Invoice(
                invoiceNumber,
                order,
                order.getCustomer(),
                request.getIssueDate() != null ? request.getIssueDate() : LocalDate.now(),
                request.getDueDate() != null ? request.getDueDate() : LocalDate.now().plusDays(30),
                request.getTaxRate(),
                request.getNotes()
        );

        for (CustomerOrderItem orderItem : order.getItems()) {
            InvoiceItem invoiceItem = new InvoiceItem(
                    orderItem.getProduct(),
                    orderItem.getQuantity(),
                    orderItem.getUnitPrice()
            );
            invoice.addItem(invoiceItem);
        }

        order.setInvoiced(true);
        orderRepository.save(order);

        return invoiceRepository.save(invoice);
    }

    @Transactional
    public Invoice cancelInvoice(Long id, String reason) {
        Invoice invoice = getInvoiceById(id);

        if (invoice.getStatus() == InvoiceStatus.PAID) {
            throw new BusinessException("Paid invoices cannot be cancelled");
        }

        invoice.setStatus(InvoiceStatus.CANCELLED);
        invoice.setNotes((invoice.getNotes() != null ? invoice.getNotes() + "\n" : "") + "Cancelled: " + reason);
        invoice.setUpdatedAt(LocalDateTime.now());

        if (invoice.getCustomerOrder() != null) {
            invoice.getCustomerOrder().setInvoiced(false);
            orderRepository.save(invoice.getCustomerOrder());
        }

        return invoiceRepository.save(invoice);
    }

    private String generateInvoiceNumber() {
        int year = LocalDate.now().getYear();
        long count = invoiceRepository.count() + 1;
        String number;
        do {
            number = String.format("INV-%d-%04d", year, count++);
        } while (invoiceRepository.existsByInvoiceNumber(number));
        return number;
    }
}
