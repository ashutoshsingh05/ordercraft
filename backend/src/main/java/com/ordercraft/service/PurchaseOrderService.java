package com.ordercraft.service;

import com.ordercraft.dto.GoodsReceiptItemRequest;
import com.ordercraft.dto.GoodsReceiptRequest;
import com.ordercraft.dto.PurchaseOrderItemRequest;
import com.ordercraft.dto.PurchaseOrderRequest;
import com.ordercraft.entity.*;
import com.ordercraft.exception.BusinessException;
import com.ordercraft.exception.ResourceNotFoundException;
import com.ordercraft.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class PurchaseOrderService {

    private final PurchaseOrderRepository poRepository;
    private final SupplierRepository supplierRepository;
    private final RawMaterialRepository rawMaterialRepository;
    private final GoodsReceiptRepository receiptRepository;
    private final RawMaterialService rawMaterialService;

    public PurchaseOrderService(PurchaseOrderRepository poRepository,
                                SupplierRepository supplierRepository,
                                RawMaterialRepository rawMaterialRepository,
                                GoodsReceiptRepository receiptRepository,
                                RawMaterialService rawMaterialService) {
        this.poRepository = poRepository;
        this.supplierRepository = supplierRepository;
        this.rawMaterialRepository = rawMaterialRepository;
        this.receiptRepository = receiptRepository;
        this.rawMaterialService = rawMaterialService;
    }

    public Page<PurchaseOrder> getPurchaseOrders(PurchaseOrderStatus status, String search, Pageable pageable) {
        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        return poRepository.searchPurchaseOrders(status, cleanSearch, pageable);
    }

    public PurchaseOrder getPoById(Long id) {
        return poRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase order not found with id: " + id));
    }

    public List<GoodsReceipt> getGoodsReceiptsByPo(Long poId) {
        return receiptRepository.findByPurchaseOrderId(poId);
    }

    @Transactional
    public PurchaseOrder createPurchaseOrder(PurchaseOrderRequest request) {
        Supplier supplier = supplierRepository.findById(request.getSupplierId())
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found with id: " + request.getSupplierId()));

        String poNumber = generatePoNumber();
        PurchaseOrder po = new PurchaseOrder(
                poNumber,
                supplier,
                request.getOrderDate(),
                request.getExpectedDeliveryDate(),
                request.getNotes()
        );

        for (PurchaseOrderItemRequest itemReq : request.getItems()) {
            RawMaterial material = rawMaterialRepository.findById(itemReq.getRawMaterialId())
                    .orElseThrow(() -> new ResourceNotFoundException("Raw material not found with id: " + itemReq.getRawMaterialId()));

            PurchaseOrderItem item = new PurchaseOrderItem(
                    material,
                    itemReq.getOrderedQuantity(),
                    itemReq.getUnitPrice()
            );
            po.addItem(item);
        }

        return poRepository.save(po);
    }

    @Transactional
    public PurchaseOrder submitPurchaseOrder(Long id) {
        PurchaseOrder po = getPoById(id);
        if (po.getStatus() != PurchaseOrderStatus.DRAFT) {
            throw new BusinessException("Only DRAFT purchase orders can be submitted");
        }
        po.setStatus(PurchaseOrderStatus.SUBMITTED);
        po.setUpdatedAt(LocalDateTime.now());
        return poRepository.save(po);
    }

    @Transactional
    public PurchaseOrder cancelPurchaseOrder(Long id, String reason) {
        PurchaseOrder po = getPoById(id);
        if (po.getStatus() == PurchaseOrderStatus.RECEIVED) {
            throw new BusinessException("Cannot cancel an already received purchase order");
        }
        po.setStatus(PurchaseOrderStatus.CANCELLED);
        po.setNotes((po.getNotes() != null ? po.getNotes() + "\n" : "") + "Cancelled: " + reason);
        po.setUpdatedAt(LocalDateTime.now());
        return poRepository.save(po);
    }

    @Transactional
    public GoodsReceipt receiveGoods(GoodsReceiptRequest request) {
        PurchaseOrder po = getPoById(request.getPurchaseOrderId());

        if (po.getStatus() != PurchaseOrderStatus.SUBMITTED && po.getStatus() != PurchaseOrderStatus.PARTIALLY_RECEIVED) {
            throw new BusinessException("Goods can only be received for SUBMITTED or PARTIALLY_RECEIVED purchase orders");
        }

        String receiptNumber = generateReceiptNumber();
        String receivedBy = getCurrentUsername();

        GoodsReceipt receipt = new GoodsReceipt(
                receiptNumber,
                po,
                request.getReceiptDate(),
                request.getNotes(),
                receivedBy
        );

        for (GoodsReceiptItemRequest itemReq : request.getItems()) {
            RawMaterial material = rawMaterialRepository.findById(itemReq.getRawMaterialId())
                    .orElseThrow(() -> new ResourceNotFoundException("Material not found: " + itemReq.getRawMaterialId()));

            // Find matching item in PO
            PurchaseOrderItem poItem = po.getItems().stream()
                    .filter(pi -> pi.getRawMaterial().getId().equals(material.getId()))
                    .findFirst()
                    .orElseThrow(() -> new BusinessException("Material " + material.getName() + " is not part of PO " + po.getPoNumber()));

            BigDecimal currentReceived = poItem.getReceivedQuantity() != null ? poItem.getReceivedQuantity() : BigDecimal.ZERO;
            BigDecimal newReceived = currentReceived.add(itemReq.getQuantityReceived());

            if (newReceived.compareTo(poItem.getOrderedQuantity()) > 0) {
                throw new BusinessException(String.format("Total received quantity (%s) cannot exceed ordered quantity (%s) for material %s",
                        newReceived, poItem.getOrderedQuantity(), material.getName()));
            }

            poItem.setReceivedQuantity(newReceived);

            // Update inventory
            BigDecimal newStock = material.getCurrentStock().add(itemReq.getQuantityReceived());
            material.setCurrentStock(newStock);
            rawMaterialRepository.save(material);

            rawMaterialService.recordTransaction(
                    material,
                    InventoryTransactionType.RECEIPT,
                    itemReq.getQuantityReceived(),
                    newStock,
                    "PURCHASE_ORDER",
                    po.getPoNumber(),
                    "Goods Receipt " + receiptNumber + " for PO " + po.getPoNumber()
            );

            GoodsReceiptItem receiptItem = new GoodsReceiptItem(material, itemReq.getQuantityReceived());
            receipt.addItem(receiptItem);
        }

        receipt = receiptRepository.save(receipt);

        // Check if all items are fully received
        boolean allFullyReceived = true;
        for (PurchaseOrderItem pi : po.getItems()) {
            if (pi.getReceivedQuantity().compareTo(pi.getOrderedQuantity()) < 0) {
                allFullyReceived = false;
                break;
            }
        }

        po.setStatus(allFullyReceived ? PurchaseOrderStatus.RECEIVED : PurchaseOrderStatus.PARTIALLY_RECEIVED);
        po.setUpdatedAt(LocalDateTime.now());
        poRepository.save(po);

        return receipt;
    }

    private String generatePoNumber() {
        int year = LocalDate.now().getYear();
        long count = poRepository.count() + 1;
        String number;
        do {
            number = String.format("PO-%d-%04d", year, count++);
        } while (poRepository.existsByPoNumber(number));
        return number;
    }

    private String generateReceiptNumber() {
        int year = LocalDate.now().getYear();
        long count = receiptRepository.count() + 1;
        String number;
        do {
            number = String.format("GR-%d-%04d", year, count++);
        } while (receiptRepository.findByReceiptNumber(number).isPresent());
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
