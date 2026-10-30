package com.ordercraft.repository;

import com.ordercraft.entity.Payment;
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
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByPaymentNumber(String paymentNumber);
    boolean existsByPaymentNumber(String paymentNumber);
    List<Payment> findByInvoiceId(Long invoiceId);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p")
    BigDecimal sumTotalCollected();

    @Query("SELECT p FROM Payment p WHERE " +
           "(:keyword IS NULL OR LOWER(p.paymentNumber) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(p.invoice.invoiceNumber) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(p.invoice.customer.name) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Payment> searchPayments(@Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT p FROM Payment p WHERE p.paymentDate BETWEEN :startDate AND :endDate")
    List<Payment> findPaymentsBetween(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
}
