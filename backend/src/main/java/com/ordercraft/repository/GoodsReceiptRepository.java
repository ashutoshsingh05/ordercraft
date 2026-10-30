package com.ordercraft.repository;

import com.ordercraft.entity.GoodsReceipt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface GoodsReceiptRepository extends JpaRepository<GoodsReceipt, Long> {
    Optional<GoodsReceipt> findByReceiptNumber(String receiptNumber);
    List<GoodsReceipt> findByPurchaseOrderId(Long purchaseOrderId);
}
