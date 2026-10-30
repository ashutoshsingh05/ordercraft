package com.ordercraft.repository;

import com.ordercraft.entity.RawMaterial;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface RawMaterialRepository extends JpaRepository<RawMaterial, Long> {
    Optional<RawMaterial> findByMaterialCode(String materialCode);
    boolean existsByMaterialCode(String materialCode);
    List<RawMaterial> findByActiveTrue();

    @Query("SELECT r FROM RawMaterial r WHERE r.currentStock <= r.reorderLevel AND r.active = true")
    List<RawMaterial> findLowStockMaterials();

    @Query("SELECT r FROM RawMaterial r WHERE " +
           "LOWER(r.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(r.materialCode) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    Page<RawMaterial> searchMaterials(@Param("keyword") String keyword, Pageable pageable);
}
