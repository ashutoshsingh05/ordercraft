package com.ordercraft.controller;

import com.ordercraft.dto.ManufacturingOrderRequest;
import com.ordercraft.dto.MaterialRequirementDto;
import com.ordercraft.entity.ManufacturingOrder;
import com.ordercraft.entity.ManufacturingStatus;
import com.ordercraft.service.ManufacturingService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/manufacturing")
public class ManufacturingController {

    private final ManufacturingService manufacturingService;

    public ManufacturingController(ManufacturingService manufacturingService) {
        this.manufacturingService = manufacturingService;
    }

    @GetMapping
    public ResponseEntity<Page<ManufacturingOrder>> getManufacturingOrders(
            @RequestParam(required = false) ManufacturingStatus status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id,desc") String sort) {
        String[] sortParams = sort.split(",");
        Sort.Direction direction = sortParams.length > 1 && sortParams[1].equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(direction, sortParams[0]));
        return ResponseEntity.ok(manufacturingService.getManufacturingOrders(status, search, pageRequest));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ManufacturingOrder> getMoById(@PathVariable Long id) {
        return ResponseEntity.ok(manufacturingService.getMoById(id));
    }

    @GetMapping("/{id}/requirements")
    public ResponseEntity<List<MaterialRequirementDto>> checkRequirements(@PathVariable Long id) {
        return ResponseEntity.ok(manufacturingService.checkRequirementsForMo(id));
    }

    @PostMapping
    public ResponseEntity<ManufacturingOrder> createMo(@Valid @RequestBody ManufacturingOrderRequest request) {
        return new ResponseEntity<>(manufacturingService.createManufacturingOrder(request), HttpStatus.CREATED);
    }

    @PostMapping("/{id}/start")
    public ResponseEntity<ManufacturingOrder> startProduction(@PathVariable Long id) {
        return ResponseEntity.ok(manufacturingService.startProduction(id));
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<ManufacturingOrder> completeProduction(@PathVariable Long id) {
        return ResponseEntity.ok(manufacturingService.completeProduction(id));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<ManufacturingOrder> cancelProduction(@PathVariable Long id, @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null ? body.getOrDefault("reason", "Cancelled by user") : "Cancelled by user";
        return ResponseEntity.ok(manufacturingService.cancelProduction(id, reason));
    }
}
