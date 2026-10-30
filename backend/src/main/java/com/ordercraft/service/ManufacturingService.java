package com.ordercraft.service;

import com.ordercraft.dto.ManufacturingOrderRequest;
import com.ordercraft.dto.MaterialRequirementDto;
import com.ordercraft.entity.*;
import com.ordercraft.exception.BusinessException;
import com.ordercraft.exception.InsufficientStockException;
import com.ordercraft.exception.ResourceNotFoundException;
import com.ordercraft.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class ManufacturingService {

    private final ManufacturingOrderRepository moRepository;
    private final CustomerOrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final RawMaterialRepository rawMaterialRepository;
    private final BomService bomService;
    private final RawMaterialService rawMaterialService;

    public ManufacturingService(ManufacturingOrderRepository moRepository,
                                CustomerOrderRepository orderRepository,
                                ProductRepository productRepository,
                                RawMaterialRepository rawMaterialRepository,
                                BomService bomService,
                                RawMaterialService rawMaterialService) {
        this.moRepository = moRepository;
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.rawMaterialRepository = rawMaterialRepository;
        this.bomService = bomService;
        this.rawMaterialService = rawMaterialService;
    }

    public Page<ManufacturingOrder> getManufacturingOrders(ManufacturingStatus status, String search, Pageable pageable) {
        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        return moRepository.searchManufacturingOrders(status, cleanSearch, pageable);
    }

    public ManufacturingOrder getMoById(Long id) {
        return moRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Manufacturing order not found with id: " + id));
    }

    public List<MaterialRequirementDto> checkRequirementsForMo(Long moId) {
        ManufacturingOrder mo = getMoById(moId);
        return bomService.calculateRequirements(mo.getProduct().getId(), mo.getTargetQuantity());
    }

    @Transactional
    public ManufacturingOrder createManufacturingOrder(ManufacturingOrderRequest request) {
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + request.getProductId()));

        CustomerOrder customerOrder = null;
        if (request.getCustomerOrderId() != null) {
            customerOrder = orderRepository.findById(request.getCustomerOrderId())
                    .orElseThrow(() -> new ResourceNotFoundException("Customer order not found with id: " + request.getCustomerOrderId()));
        }

        String moNumber = generateMoNumber();
        ManufacturingOrder mo = new ManufacturingOrder(
                moNumber,
                customerOrder,
                product,
                request.getTargetQuantity(),
                request.getStartDate(),
                request.getNotes()
        );

        return moRepository.save(mo);
    }

    @Transactional
    public ManufacturingOrder startProduction(Long moId) {
        ManufacturingOrder mo = getMoById(moId);

        if (mo.getStatus() != ManufacturingStatus.PLANNED) {
            throw new BusinessException("Only PLANNED manufacturing orders can be started");
        }

        if (mo.isMaterialsIssued()) {
            throw new BusinessException("Materials have already been issued for this manufacturing order");
        }

        // 1. Check material availability from BOM
        List<MaterialRequirementDto> requirements = bomService.calculateRequirements(
                mo.getProduct().getId(), mo.getTargetQuantity()
        );

        for (MaterialRequirementDto req : requirements) {
            if (req.isShortage()) {
                throw new InsufficientStockException(req.getMaterialCode(), req.getRequiredQuantity(), req.getAvailableStock());
            }
        }

        // 2. Consume raw materials
        for (MaterialRequirementDto req : requirements) {
            RawMaterial material = rawMaterialRepository.findById(req.getRawMaterialId())
                    .orElseThrow(() -> new ResourceNotFoundException("Material not found: " + req.getRawMaterialId()));

            BigDecimal newStock = material.getCurrentStock().subtract(req.getRequiredQuantity());
            material.setCurrentStock(newStock);
            rawMaterialRepository.save(material);

            rawMaterialService.recordTransaction(
                    material,
                    InventoryTransactionType.CONSUMPTION,
                    req.getRequiredQuantity(),
                    newStock,
                    "MANUFACTURING_ORDER",
                    mo.getMoNumber(),
                    "Consumed for MO " + mo.getMoNumber() + " (" + mo.getProduct().getName() + ")"
            );
        }

        mo.setMaterialsIssued(true);
        mo.setStatus(ManufacturingStatus.IN_PROGRESS);
        mo.setUpdatedAt(LocalDateTime.now());

        // Update associated customer order status if applicable
        if (mo.getCustomerOrder() != null && mo.getCustomerOrder().getStatus() == CustomerOrderStatus.CONFIRMED) {
            mo.getCustomerOrder().setStatus(CustomerOrderStatus.IN_PRODUCTION);
            orderRepository.save(mo.getCustomerOrder());
        }

        return moRepository.save(mo);
    }

    @Transactional
    public ManufacturingOrder completeProduction(Long moId) {
        ManufacturingOrder mo = getMoById(moId);

        if (mo.getStatus() != ManufacturingStatus.IN_PROGRESS) {
            throw new BusinessException("Only IN_PROGRESS manufacturing orders can be completed");
        }

        mo.setStatus(ManufacturingStatus.COMPLETED);
        mo.setCompletionDate(LocalDate.now());
        mo.setUpdatedAt(LocalDateTime.now());

        if (mo.getCustomerOrder() != null && mo.getCustomerOrder().getStatus() == CustomerOrderStatus.IN_PRODUCTION) {
            mo.getCustomerOrder().setStatus(CustomerOrderStatus.COMPLETED);
            orderRepository.save(mo.getCustomerOrder());
        }

        return moRepository.save(mo);
    }

    @Transactional
    public ManufacturingOrder cancelProduction(Long moId, String reason) {
        ManufacturingOrder mo = getMoById(moId);

        if (mo.getStatus() == ManufacturingStatus.COMPLETED) {
            throw new BusinessException("Completed manufacturing orders cannot be cancelled");
        }

        mo.setStatus(ManufacturingStatus.CANCELLED);
        mo.setNotes((mo.getNotes() != null ? mo.getNotes() + "\n" : "") + "Cancelled: " + reason);
        mo.setUpdatedAt(LocalDateTime.now());

        return moRepository.save(mo);
    }

    private String generateMoNumber() {
        int year = LocalDate.now().getYear();
        long count = moRepository.count() + 1;
        String number;
        do {
            number = String.format("MO-%d-%04d", year, count++);
        } while (moRepository.existsByMoNumber(number));
        return number;
    }
}
