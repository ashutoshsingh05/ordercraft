package com.ordercraft.service;

import com.ordercraft.dto.PaymentRequest;
import com.ordercraft.entity.Invoice;
import com.ordercraft.entity.InvoiceStatus;
import com.ordercraft.entity.Payment;
import com.ordercraft.exception.BusinessException;
import com.ordercraft.exception.ResourceNotFoundException;
import com.ordercraft.repository.InvoiceRepository;
import com.ordercraft.repository.PaymentRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final InvoiceRepository invoiceRepository;

    public PaymentService(PaymentRepository paymentRepository, InvoiceRepository invoiceRepository) {
        this.paymentRepository = paymentRepository;
        this.invoiceRepository = invoiceRepository;
    }

    public Page<Payment> getPayments(String search, Pageable pageable) {
        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        return paymentRepository.searchPayments(cleanSearch, pageable);
    }

    public List<Payment> getPaymentsByInvoice(Long invoiceId) {
        return paymentRepository.findByInvoiceId(invoiceId);
    }

    public Payment getPaymentById(Long id) {
        return paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with id: " + id));
    }

    @Transactional
    public Payment recordPayment(PaymentRequest request) {
        Invoice invoice = invoiceRepository.findById(request.getInvoiceId())
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with id: " + request.getInvoiceId()));

        if (invoice.getStatus() == InvoiceStatus.PAID) {
            throw new BusinessException("Invoice " + invoice.getInvoiceNumber() + " is already fully paid");
        }

        if (invoice.getStatus() == InvoiceStatus.CANCELLED) {
            throw new BusinessException("Cannot record payment against a cancelled invoice");
        }

        BigDecimal balanceDue = invoice.getBalanceDue();
        if (request.getAmount().compareTo(balanceDue) > 0) {
            throw new BusinessException(String.format("Payment amount ($%s) cannot exceed the outstanding balance ($%s)",
                    request.getAmount(), balanceDue));
        }

        String paymentNumber = generatePaymentNumber();
        String recordedBy = getCurrentUsername();

        Payment payment = new Payment(
                paymentNumber,
                invoice,
                request.getPaymentDate() != null ? request.getPaymentDate() : LocalDate.now(),
                request.getAmount(),
                request.getPaymentMethod(),
                request.getReferenceNumber(),
                request.getNotes(),
                recordedBy
        );

        payment = paymentRepository.save(payment);

        // Update invoice paidAmount and balanceDue
        invoice.recordPayment(request.getAmount());
        invoiceRepository.save(invoice);

        return payment;
    }

    private String generatePaymentNumber() {
        int year = LocalDate.now().getYear();
        long count = paymentRepository.count() + 1;
        String number;
        do {
            number = String.format("PAY-%d-%04d", year, count++);
        } while (paymentRepository.existsByPaymentNumber(number));
        return number;
    }

    private String getCurrentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !auth.getName().equals("anonymousUser")) {
            return auth.getName();
        }
        return "SYSTEM";
    }
}
