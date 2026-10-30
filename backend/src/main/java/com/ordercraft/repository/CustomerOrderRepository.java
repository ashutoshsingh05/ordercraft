package com.ordercraft.repository;

import com.ordercraft.entity.CustomerOrder;
import com.ordercraft.entity.CustomerOrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerOrderRepository extends JpaRepository<CustomerOrder, Long> {
    Optional<CustomerOrder> findByOrderNumber(String orderNumber);
    boolean existsByOrderNumber(String orderNumber);
    long countByStatus(CustomerOrderStatus status);

    List<CustomerOrder> findTop5ByOrderByCreatedAtDesc();

    @Query("SELECT o FROM CustomerOrder o WHERE " +
           "(:status IS NULL OR o.status = :status) AND " +
           "(:keyword IS NULL OR LOWER(o.orderNumber) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(o.customer.name) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<CustomerOrder> searchOrders(@Param("status") CustomerOrderStatus status,
                                     @Param("keyword") String keyword,
                                     Pageable pageable);

    @Query("SELECT o FROM CustomerOrder o WHERE o.orderDate BETWEEN :startDate AND :endDate")
    List<CustomerOrder> findOrdersBetween(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
}
