package com.ordercraft.repository;

import com.ordercraft.entity.PurchaseOrder;
import com.ordercraft.entity.PurchaseOrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, Long> {
    Optional<PurchaseOrder> findByPoNumber(String poNumber);
    boolean existsByPoNumber(String poNumber);
    long countByStatus(PurchaseOrderStatus status);

    @Query("SELECT p FROM PurchaseOrder p WHERE " +
           "(:status IS NULL OR p.status = :status) AND " +
           "(:keyword IS NULL OR LOWER(p.poNumber) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(p.supplier.name) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<PurchaseOrder> searchPurchaseOrders(@Param("status") PurchaseOrderStatus status,
                                             @Param("keyword") String keyword,
                                             Pageable pageable);
}
