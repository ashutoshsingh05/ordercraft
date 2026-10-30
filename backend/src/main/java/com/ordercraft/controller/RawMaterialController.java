package com.ordercraft.controller;

import com.ordercraft.dto.RawMaterialDto;
import com.ordercraft.dto.StockAdjustmentRequest;
import com.ordercraft.entity.InventoryTransaction;
import com.ordercraft.entity.RawMaterial;
import com.ordercraft.service.RawMaterialService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/raw-materials")
public class RawMaterialController {

    private final RawMaterialService rawMaterialService;

    public RawMaterialController(RawMaterialService rawMaterialService) {
        this.rawMaterialService = rawMaterialService;
    }

    @GetMapping
    public ResponseEntity<Page<RawMaterial>> getMaterials(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id,desc") String sort) {
        String[] sortParams = sort.split(",");
        Sort.Direction direction = sortParams.length > 1 && sortParams[1].equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(direction, sortParams[0]));
        return ResponseEntity.ok(rawMaterialService.getMaterials(search, pageRequest));
    }

    @GetMapping("/active")
    public ResponseEntity<List<RawMaterial>> getActiveMaterials() {
        return ResponseEntity.ok(rawMaterialService.getAllActiveMaterials());
    }

    @GetMapping("/low-stock")
    public ResponseEntity<List<RawMaterial>> getLowStockMaterials() {
        return ResponseEntity.ok(rawMaterialService.getLowStockMaterials());
    }

    @GetMapping("/{id}")
    public ResponseEntity<RawMaterial> getMaterialById(@PathVariable Long id) {
        return ResponseEntity.ok(rawMaterialService.getMaterialById(id));
    }

    @PostMapping
    public ResponseEntity<RawMaterial> createMaterial(@Valid @RequestBody RawMaterialDto dto) {
        return new ResponseEntity<>(rawMaterialService.createMaterial(dto), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<RawMaterial> updateMaterial(@PathVariable Long id, @Valid @RequestBody RawMaterialDto dto) {
        return ResponseEntity.ok(rawMaterialService.updateMaterial(id, dto));
    }

    @PostMapping("/adjust-stock")
    public ResponseEntity<RawMaterial> adjustStock(@Valid @RequestBody StockAdjustmentRequest request) {
        return ResponseEntity.ok(rawMaterialService.adjustStock(request));
    }

    @GetMapping("/{id}/transactions")
    public ResponseEntity<List<InventoryTransaction>> getTransactions(@PathVariable Long id) {
        return ResponseEntity.ok(rawMaterialService.getTransactionsByMaterial(id));
    }

    @GetMapping("/transactions")
    public ResponseEntity<Page<InventoryTransaction>> getAllTransactions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        PageRequest pageRequest = PageRequest.of(page, size);
        return ResponseEntity.ok(rawMaterialService.getAllTransactions(pageRequest));
    }
}
