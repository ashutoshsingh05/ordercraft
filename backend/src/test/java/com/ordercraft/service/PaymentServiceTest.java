package com.ordercraft.service;

import com.ordercraft.dto.PaymentRequest;
import com.ordercraft.entity.*;
import com.ordercraft.exception.BusinessException;
import com.ordercraft.repository.InvoiceRepository;
import com.ordercraft.repository.PaymentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class PaymentServiceTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private InvoiceRepository invoiceRepository;

    @InjectMocks
    private PaymentService paymentService;

    private Invoice invoice;

    @BeforeEach
    void setUp() {
        Customer customer = new Customer("CUST-01", "Client Inc", "client@example.com", "555-1234", "Address", "TAX-01");
        customer.setId(1L);

        invoice = new Invoice("INV-2026-0001", null, customer, LocalDate.now(), LocalDate.now().plusDays(30), BigDecimal.ZERO, "Notes");
        invoice.setId(5L);
        invoice.setSubtotal(new BigDecimal("1000.00"));
        invoice.setTotalAmount(new BigDecimal("1000.00"));
        invoice.setPaidAmount(new BigDecimal("0.00"));
        invoice.setBalanceDue(new BigDecimal("1000.00"));
        invoice.setStatus(InvoiceStatus.ISSUED);
    }

    @Test
    void testRecordPayment_PartialPaymentUpdatesInvoice() {
        when(invoiceRepository.findById(5L)).thenReturn(Optional.of(invoice));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PaymentRequest req = new PaymentRequest();
        req.setInvoiceId(5L);
        req.setAmount(BigDecimal.valueOf(400.00));
        req.setPaymentMethod(PaymentMethod.BANK_TRANSFER);

        Payment payment = paymentService.recordPayment(req);

        assertNotNull(payment);
        assertEquals(0, new BigDecimal("400.00").compareTo(payment.getAmount()));
        assertEquals(0, new BigDecimal("400.00").compareTo(invoice.getPaidAmount()));
        assertEquals(0, new BigDecimal("600.00").compareTo(invoice.getBalanceDue()));
        assertEquals(InvoiceStatus.PARTIALLY_PAID, invoice.getStatus());
        verify(invoiceRepository, times(1)).save(invoice);
    }

    @Test
    void testRecordPayment_FullPaymentSetsInvoicePaid() {
        when(invoiceRepository.findById(5L)).thenReturn(Optional.of(invoice));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PaymentRequest req = new PaymentRequest();
        req.setInvoiceId(5L);
        req.setAmount(BigDecimal.valueOf(1000.00));
        req.setPaymentMethod(PaymentMethod.ONLINE);

        Payment payment = paymentService.recordPayment(req);

        assertNotNull(payment);
        assertEquals(0, new BigDecimal("1000.00").compareTo(invoice.getPaidAmount()));
        assertEquals(0, BigDecimal.ZERO.compareTo(invoice.getBalanceDue()));
        assertEquals(InvoiceStatus.PAID, invoice.getStatus());
    }

    @Test
    void testRecordPayment_ExceedingBalanceThrowsException() {
        when(invoiceRepository.findById(5L)).thenReturn(Optional.of(invoice));

        PaymentRequest req = new PaymentRequest();
        req.setInvoiceId(5L);
        req.setAmount(BigDecimal.valueOf(1500.00)); // Exceeds balance of 1000.00
        req.setPaymentMethod(PaymentMethod.CASH);

        assertThrows(BusinessException.class, () -> paymentService.recordPayment(req));
        verify(paymentRepository, never()).save(any());
    }
}
