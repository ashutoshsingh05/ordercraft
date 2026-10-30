package com.ordercraft.controller;

import com.ordercraft.dto.GoodsReceiptRequest;
import com.ordercraft.dto.PurchaseOrderRequest;
import com.ordercraft.entity.GoodsReceipt;
import com.ordercraft.entity.PurchaseOrder;
import com.ordercraft.entity.PurchaseOrderStatus;
import com.ordercraft.service.PurchaseOrderService;
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
@RequestMapping("/api/purchase-orders")
public class PurchaseOrderController {

    private final PurchaseOrderService poService;

    public PurchaseOrderController(PurchaseOrderService poService) {
        this.poService = poService;
    }

    @GetMapping
    public ResponseEntity<Page<PurchaseOrder>> getPurchaseOrders(
            @RequestParam(required = false) PurchaseOrderStatus status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id,desc") String sort) {
        String[] sortParams = sort.split(",");
        Sort.Direction direction = sortParams.length > 1 && sortParams[1].equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(direction, sortParams[0]));
        return ResponseEntity.ok(poService.getPurchaseOrders(status, search, pageRequest));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PurchaseOrder> getPoById(@PathVariable Long id) {
        return ResponseEntity.ok(poService.getPoById(id));
    }

    @GetMapping("/{id}/receipts")
    public ResponseEntity<List<GoodsReceipt>> getReceipts(@PathVariable Long id) {
        return ResponseEntity.ok(poService.getGoodsReceiptsByPo(id));
    }

    @PostMapping
    public ResponseEntity<PurchaseOrder> createPo(@Valid @RequestBody PurchaseOrderRequest request) {
        return new ResponseEntity<>(poService.createPurchaseOrder(request), HttpStatus.CREATED);
    }

    @PostMapping("/{id}/submit")
    public ResponseEntity<PurchaseOrder> submitPo(@PathVariable Long id) {
        return ResponseEntity.ok(poService.submitPurchaseOrder(id));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<PurchaseOrder> cancelPo(@PathVariable Long id, @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null ? body.getOrDefault("reason", "Cancelled by user") : "Cancelled by user";
        return ResponseEntity.ok(poService.cancelPurchaseOrder(id, reason));
    }

    @PostMapping("/receive")
    public ResponseEntity<GoodsReceipt> receiveGoods(@Valid @RequestBody GoodsReceiptRequest request) {
        return new ResponseEntity<>(poService.receiveGoods(request), HttpStatus.CREATED);
    }
}
