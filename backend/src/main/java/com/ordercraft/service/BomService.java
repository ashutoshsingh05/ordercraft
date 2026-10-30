package com.ordercraft.service;

import com.ordercraft.dto.BomItemRequest;
import com.ordercraft.dto.BomItemResponse;
import com.ordercraft.dto.MaterialRequirementDto;
import com.ordercraft.entity.BomItem;
import com.ordercraft.entity.Product;
import com.ordercraft.entity.RawMaterial;
import com.ordercraft.exception.BusinessException;
import com.ordercraft.exception.ResourceNotFoundException;
import com.ordercraft.repository.BomItemRepository;
import com.ordercraft.repository.ProductRepository;
import com.ordercraft.repository.RawMaterialRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class BomService {

    private final BomItemRepository bomItemRepository;
    private final ProductRepository productRepository;
    private final RawMaterialRepository rawMaterialRepository;

    public BomService(BomItemRepository bomItemRepository,
                      ProductRepository productRepository,
                      RawMaterialRepository rawMaterialRepository) {
        this.bomItemRepository = bomItemRepository;
        this.productRepository = productRepository;
        this.rawMaterialRepository = rawMaterialRepository;
    }

    public List<BomItemResponse> getBomForProduct(Long productId) {
        List<BomItem> items = bomItemRepository.findByProductId(productId);
        return items.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional
    public BomItemResponse addBomItem(BomItemRequest request) {
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + request.getProductId()));

        RawMaterial material = rawMaterialRepository.findById(request.getRawMaterialId())
                .orElseThrow(() -> new ResourceNotFoundException("Raw material not found with id: " + request.getRawMaterialId()));

        if (bomItemRepository.existsByProductIdAndRawMaterialId(product.getId(), material.getId())) {
            throw new BusinessException("Raw material '" + material.getName() + "' is already defined in the BOM for product '" + product.getName() + "'");
        }

        BomItem item = new BomItem(
                product,
                material,
                request.getQuantityRequired(),
                request.getScrapPercentage(),
                request.getNotes()
        );

        item = bomItemRepository.save(item);
        return mapToResponse(item);
    }

    @Transactional
    public BomItemResponse updateBomItem(Long id, BomItemRequest request) {
        BomItem item = bomItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("BOM item not found with id: " + id));

        RawMaterial material = rawMaterialRepository.findById(request.getRawMaterialId())
                .orElseThrow(() -> new ResourceNotFoundException("Raw material not found with id: " + request.getRawMaterialId()));

        item.setRawMaterial(material);
        item.setQuantityRequired(request.getQuantityRequired());
        item.setScrapPercentage(request.getScrapPercentage());
        item.setNotes(request.getNotes());

        item = bomItemRepository.save(item);
        return mapToResponse(item);
    }

    @Transactional
    public void deleteBomItem(Long id) {
        if (!bomItemRepository.existsById(id)) {
            throw new ResourceNotFoundException("BOM item not found with id: " + id);
        }
        bomItemRepository.deleteById(id);
    }

    public List<MaterialRequirementDto> calculateRequirements(Long productId, BigDecimal quantity) {
        List<BomItem> bomItems = bomItemRepository.findByProductId(productId);
        List<MaterialRequirementDto> requirements = new ArrayList<>();

        for (BomItem item : bomItems) {
            BigDecimal qtyPerUnit = item.getQuantityRequired();
            // Include scrap percentage if specified: total = qtyPerUnit * (1 + scrap/100) * quantity
            BigDecimal scrapFactor = BigDecimal.ONE;
            if (item.getScrapPercentage() != null && item.getScrapPercentage().compareTo(BigDecimal.ZERO) > 0) {
                scrapFactor = BigDecimal.ONE.add(item.getScrapPercentage().divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP));
            }

            BigDecimal totalRequired = qtyPerUnit.multiply(scrapFactor).multiply(quantity).setScale(2, RoundingMode.HALF_UP);
            RawMaterial material = item.getRawMaterial();

            requirements.add(new MaterialRequirementDto(
                    material.getId(),
                    material.getMaterialCode(),
                    material.getName(),
                    material.getUnitOfMeasure(),
                    totalRequired,
                    material.getCurrentStock()
            ));
        }

        return requirements;
    }

    private BomItemResponse mapToResponse(BomItem item) {
        BomItemResponse res = new BomItemResponse();
        res.setId(item.getId());
        res.setProductId(item.getProduct().getId());
        res.setProductCode(item.getProduct().getProductCode());
        res.setProductName(item.getProduct().getName());
        res.setRawMaterialId(item.getRawMaterial().getId());
        res.setRawMaterialCode(item.getRawMaterial().getMaterialCode());
        res.setRawMaterialName(item.getRawMaterial().getName());
        res.setUnitOfMeasure(item.getRawMaterial().getUnitOfMeasure());
        res.setQuantityRequired(item.getQuantityRequired());
        res.setScrapPercentage(item.getScrapPercentage());
        res.setUnitCost(item.getRawMaterial().getUnitCost());

        BigDecimal cost = item.getQuantityRequired().multiply(item.getRawMaterial().getUnitCost()).setScale(2, RoundingMode.HALF_UP);
        res.setComponentCost(cost);
        res.setNotes(item.getNotes());
        return res;
    }
}
