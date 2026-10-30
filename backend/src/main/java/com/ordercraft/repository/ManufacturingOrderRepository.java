package com.ordercraft.repository;

import com.ordercraft.entity.ManufacturingOrder;
import com.ordercraft.entity.ManufacturingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface ManufacturingOrderRepository extends JpaRepository<ManufacturingOrder, Long> {
    Optional<ManufacturingOrder> findByMoNumber(String moNumber);
    boolean existsByMoNumber(String moNumber);
    long countByStatus(ManufacturingStatus status);

    @Query("SELECT m FROM ManufacturingOrder m WHERE " +
           "(:status IS NULL OR m.status = :status) AND " +
           "(:keyword IS NULL OR LOWER(m.moNumber) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(m.product.name) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<ManufacturingOrder> searchManufacturingOrders(@Param("status") ManufacturingStatus status,
                                                       @Param("keyword") String keyword,
                                                       Pageable pageable);
}
