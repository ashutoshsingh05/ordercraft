package com.ordercraft.controller;

import com.ordercraft.dto.BomItemRequest;
import com.ordercraft.dto.BomItemResponse;
import com.ordercraft.dto.MaterialRequirementDto;
import com.ordercraft.service.BomService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/bom")
public class BomController {

    private final BomService bomService;

    public BomController(BomService bomService) {
        this.bomService = bomService;
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<List<BomItemResponse>> getBomForProduct(@PathVariable Long productId) {
        return ResponseEntity.ok(bomService.getBomForProduct(productId));
    }

    @PostMapping
    public ResponseEntity<BomItemResponse> addBomItem(@Valid @RequestBody BomItemRequest request) {
        return new ResponseEntity<>(bomService.addBomItem(request), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<BomItemResponse> updateBomItem(@PathVariable Long id, @Valid @RequestBody BomItemRequest request) {
        return ResponseEntity.ok(bomService.updateBomItem(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBomItem(@PathVariable Long id) {
        bomService.deleteBomItem(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/calculate")
    public ResponseEntity<List<MaterialRequirementDto>> calculateRequirements(
            @RequestParam Long productId,
            @RequestParam BigDecimal quantity) {
        return ResponseEntity.ok(bomService.calculateRequirements(productId, quantity));
    }
}
