package com.ordercraft.service;

import com.ordercraft.dto.CustomerOrderItemRequest;
import com.ordercraft.dto.CustomerOrderRequest;
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

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class CustomerOrderService {

    private final CustomerOrderRepository orderRepository;
    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;
    private final OrderStatusHistoryRepository historyRepository;

    public CustomerOrderService(CustomerOrderRepository orderRepository,
                                CustomerRepository customerRepository,
                                ProductRepository productRepository,
                                OrderStatusHistoryRepository historyRepository) {
        this.orderRepository = orderRepository;
        this.customerRepository = customerRepository;
        this.productRepository = productRepository;
        this.historyRepository = historyRepository;
    }

    public Page<CustomerOrder> getOrders(CustomerOrderStatus status, String search, Pageable pageable) {
        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        return orderRepository.searchOrders(status, cleanSearch, pageable);
    }

    public CustomerOrder getOrderById(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer order not found with id: " + id));
    }

    public List<OrderStatusHistory> getOrderStatusHistory(Long orderId) {
        return historyRepository.findByOrderIdOrderByCreatedAtDesc(orderId);
    }

    @Transactional
    public CustomerOrder createOrder(CustomerOrderRequest request) {
        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + request.getCustomerId()));

        String orderNumber = generateOrderNumber();

        CustomerOrder order = new CustomerOrder(
                orderNumber,
                customer,
                request.getOrderDate(),
                request.getDeliveryDate(),
                request.getNotes()
        );

        for (CustomerOrderItemRequest itemReq : request.getItems()) {
            Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + itemReq.getProductId()));

            CustomerOrderItem item = new CustomerOrderItem(
                    product,
                    itemReq.getQuantity(),
                    itemReq.getUnitPrice()
            );
            order.addItem(item);
        }

        order = orderRepository.save(order);
        recordHistory(order.getId(), null, CustomerOrderStatus.PENDING, "Order created", getCurrentUsername());
        return order;
    }

    @Transactional
    public CustomerOrder updateOrderStatus(Long orderId, CustomerOrderStatus newStatus, String remarks) {
        CustomerOrder order = getOrderById(orderId);
        CustomerOrderStatus currentStatus = order.getStatus();

        if (currentStatus == newStatus) {
            return order;
        }

        validateStateTransition(currentStatus, newStatus);

        order.setStatus(newStatus);
        order.setUpdatedAt(LocalDateTime.now());
        order = orderRepository.save(order);

        recordHistory(order.getId(), currentStatus, newStatus, remarks, getCurrentUsername());
        return order;
    }

    private void validateStateTransition(CustomerOrderStatus from, CustomerOrderStatus to) {
        if (from == CustomerOrderStatus.CANCELLED) {
            throw new BusinessException("Cancelled order cannot be transitioned to another status");
        }
        if (from == CustomerOrderStatus.DELIVERED && to != CustomerOrderStatus.CANCELLED) {
            throw new BusinessException("Delivered order is finalized and cannot be modified");
        }

        boolean valid = switch (from) {
            case PENDING -> to == CustomerOrderStatus.CONFIRMED || to == CustomerOrderStatus.CANCELLED;
            case CONFIRMED -> to == CustomerOrderStatus.IN_PRODUCTION || to == CustomerOrderStatus.CANCELLED;
            case IN_PRODUCTION -> to == CustomerOrderStatus.COMPLETED || to == CustomerOrderStatus.CANCELLED;
            case COMPLETED -> to == CustomerOrderStatus.DELIVERED || to == CustomerOrderStatus.CANCELLED;
            default -> false;
        };

        if (!valid) {
            throw new BusinessException(String.format("Invalid order status transition from %s to %s", from, to));
        }
    }

    private void recordHistory(Long orderId, CustomerOrderStatus prev, CustomerOrderStatus next, String remarks, String user) {
        OrderStatusHistory history = new OrderStatusHistory(orderId, prev, next, remarks, user);
        historyRepository.save(history);
    }

    private String generateOrderNumber() {
        int year = LocalDate.now().getYear();
        long count = orderRepository.count() + 1;
        String number;
        do {
            number = String.format("ORD-%d-%04d", year, count++);
        } while (orderRepository.existsByOrderNumber(number));
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
