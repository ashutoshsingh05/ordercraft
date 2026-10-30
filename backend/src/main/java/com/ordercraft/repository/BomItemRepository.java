package com.ordercraft.repository;

import com.ordercraft.entity.BomItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BomItemRepository extends JpaRepository<BomItem, Long> {
    List<BomItem> findByProductId(Long productId);
    boolean existsByProductIdAndRawMaterialId(Long productId, Long rawMaterialId);
    void deleteByProductId(Long productId);
}
