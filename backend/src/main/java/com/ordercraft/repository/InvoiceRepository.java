package com.ordercraft.repository;

import com.ordercraft.entity.Invoice;
import com.ordercraft.entity.InvoiceStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);
    boolean existsByInvoiceNumber(String invoiceNumber);
    boolean existsByCustomerOrderId(Long orderId);

    long countByStatus(InvoiceStatus status);

    @Query("SELECT COALESCE(SUM(i.totalAmount), 0) FROM Invoice i WHERE i.status != 'CANCELLED'")
    BigDecimal sumTotalInvoicedAmount();

    @Query("SELECT COALESCE(SUM(i.balanceDue), 0) FROM Invoice i WHERE i.status != 'CANCELLED' AND i.status != 'PAID'")
    BigDecimal sumOutstandingPayments();

    @Query("SELECT i FROM Invoice i WHERE " +
           "(:status IS NULL OR i.status = :status) AND " +
           "(:keyword IS NULL OR LOWER(i.invoiceNumber) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(i.customer.name) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Invoice> searchInvoices(@Param("status") InvoiceStatus status,
                                 @Param("keyword") String keyword,
                                 Pageable pageable);

    @Query("SELECT i FROM Invoice i WHERE i.issueDate BETWEEN :startDate AND :endDate")
    List<Invoice> findInvoicesBetween(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
}
