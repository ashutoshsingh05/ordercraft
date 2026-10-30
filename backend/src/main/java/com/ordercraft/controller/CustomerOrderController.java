package com.ordercraft.controller;

import com.ordercraft.dto.CustomerOrderRequest;
import com.ordercraft.entity.CustomerOrder;
import com.ordercraft.entity.CustomerOrderStatus;
import com.ordercraft.entity.OrderStatusHistory;
import com.ordercraft.service.CustomerOrderService;
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
@RequestMapping("/api/orders")
public class CustomerOrderController {

    private final CustomerOrderService orderService;

    public CustomerOrderController(CustomerOrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping
    public ResponseEntity<Page<CustomerOrder>> getOrders(
            @RequestParam(required = false) CustomerOrderStatus status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id,desc") String sort) {
        String[] sortParams = sort.split(",");
        Sort.Direction direction = sortParams.length > 1 && sortParams[1].equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(direction, sortParams[0]));
        return ResponseEntity.ok(orderService.getOrders(status, search, pageRequest));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CustomerOrder> getOrderById(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getOrderById(id));
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<List<OrderStatusHistory>> getOrderHistory(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getOrderStatusHistory(id));
    }

    @PostMapping
    public ResponseEntity<CustomerOrder> createOrder(@Valid @RequestBody CustomerOrderRequest request) {
        return new ResponseEntity<>(orderService.createOrder(request), HttpStatus.CREATED);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<CustomerOrder> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        CustomerOrderStatus newStatus = CustomerOrderStatus.valueOf(body.get("status"));
        String remarks = body.getOrDefault("remarks", "Status updated");
        return ResponseEntity.ok(orderService.updateOrderStatus(id, newStatus, remarks));
    }
}
