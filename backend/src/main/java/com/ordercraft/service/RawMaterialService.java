package com.ordercraft.service;

import com.ordercraft.dto.RawMaterialDto;
import com.ordercraft.dto.StockAdjustmentRequest;
import com.ordercraft.entity.InventoryTransaction;
import com.ordercraft.entity.InventoryTransactionType;
import com.ordercraft.entity.RawMaterial;
import com.ordercraft.exception.BusinessException;
import com.ordercraft.exception.ResourceNotFoundException;
import com.ordercraft.repository.InventoryTransactionRepository;
import com.ordercraft.repository.RawMaterialRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class RawMaterialService {

    private final RawMaterialRepository rawMaterialRepository;
    private final InventoryTransactionRepository transactionRepository;

    public RawMaterialService(RawMaterialRepository rawMaterialRepository,
                              InventoryTransactionRepository transactionRepository) {
        this.rawMaterialRepository = rawMaterialRepository;
        this.transactionRepository = transactionRepository;
    }

    public List<RawMaterial> getAllActiveMaterials() {
        return rawMaterialRepository.findByActiveTrue();
    }

    public List<RawMaterial> getLowStockMaterials() {
        return rawMaterialRepository.findLowStockMaterials();
    }

    public Page<RawMaterial> getMaterials(String search, Pageable pageable) {
        if (search != null && !search.trim().isEmpty()) {
            return rawMaterialRepository.searchMaterials(search.trim(), pageable);
        }
        return rawMaterialRepository.findAll(pageable);
    }

    public RawMaterial getMaterialById(Long id) {
        return rawMaterialRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Raw material not found with id: " + id));
    }

    @Transactional
    public RawMaterial createMaterial(RawMaterialDto dto) {
        if (rawMaterialRepository.existsByMaterialCode(dto.getMaterialCode())) {
            throw new BusinessException("Material code '" + dto.getMaterialCode() + "' already exists");
        }

        RawMaterial material = new RawMaterial(
                dto.getMaterialCode(),
                dto.getName(),
                dto.getDescription(),
                dto.getUnitOfMeasure(),
                dto.getUnitCost(),
                dto.getCurrentStock(),
                dto.getMinStockLevel(),
                dto.getReorderLevel()
        );
        material = rawMaterialRepository.save(material);

        if (material.getCurrentStock().compareTo(BigDecimal.ZERO) > 0) {
            recordTransaction(material, InventoryTransactionType.RECEIPT, material.getCurrentStock(),
                    material.getCurrentStock(), "INITIAL_SETUP", "INIT", "Initial stock setup");
        }

        return material;
    }

    @Transactional
    public RawMaterial updateMaterial(Long id, RawMaterialDto dto) {
        RawMaterial material = getMaterialById(id);

        if (!material.getMaterialCode().equals(dto.getMaterialCode()) &&
            rawMaterialRepository.existsByMaterialCode(dto.getMaterialCode())) {
            throw new BusinessException("Material code '" + dto.getMaterialCode() + "' already exists");
        }

        material.setMaterialCode(dto.getMaterialCode());
        material.setName(dto.getName());
        material.setDescription(dto.getDescription());
        material.setUnitOfMeasure(dto.getUnitOfMeasure());
        material.setUnitCost(dto.getUnitCost());
        material.setMinStockLevel(dto.getMinStockLevel());
        material.setReorderLevel(dto.getReorderLevel());
        material.setActive(dto.isActive());

        return rawMaterialRepository.save(material);
    }

    @Transactional
    public RawMaterial adjustStock(StockAdjustmentRequest request) {
        RawMaterial material = getMaterialById(request.getRawMaterialId());
        BigDecimal current = material.getCurrentStock();
        BigDecimal newStock;

        if (request.getTransactionType() == InventoryTransactionType.RECEIPT) {
            newStock = current.add(request.getQuantity());
        } else if (request.getTransactionType() == InventoryTransactionType.CONSUMPTION) {
            if (current.compareTo(request.getQuantity()) < 0) {
                throw new BusinessException("Cannot deduct " + request.getQuantity() + " " + material.getUnitOfMeasure() +
                        " from available stock " + current + " " + material.getUnitOfMeasure());
            }
            newStock = current.subtract(request.getQuantity());
        } else { // ADJUSTMENT (absolute stock override or delta)
            newStock = request.getQuantity();
        }

        material.setCurrentStock(newStock);
        material = rawMaterialRepository.save(material);

        recordTransaction(material, request.getTransactionType(), request.getQuantity(),
                newStock, "MANUAL_ADJUSTMENT", "MAN-" + System.currentTimeMillis() % 100000,
                request.getNotes() != null ? request.getNotes() : "Manual stock adjustment");

        return material;
    }

    @Transactional
    public void recordTransaction(RawMaterial material, InventoryTransactionType type, BigDecimal qty,
                                  BigDecimal balanceAfter, String refType, String refNumber, String notes) {
        String username = "SYSTEM";
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !auth.getName().equals("anonymousUser")) {
            username = auth.getName();
        }

        InventoryTransaction tx = new InventoryTransaction(
                material,
                type,
                qty,
                balanceAfter,
                refType,
                refNumber,
                notes,
                username
        );
        transactionRepository.save(tx);
    }

    public List<InventoryTransaction> getTransactionsByMaterial(Long materialId) {
        return transactionRepository.findByRawMaterialIdOrderByCreatedAtDesc(materialId);
    }

    public Page<InventoryTransaction> getAllTransactions(Pageable pageable) {
        return transactionRepository.findAllByOrderByCreatedAtDesc(pageable);
    }
}
