package com.ordercraft.service;

import com.ordercraft.dto.CustomerOrderItemRequest;
import com.ordercraft.dto.CustomerOrderRequest;
import com.ordercraft.entity.*;
import com.ordercraft.exception.BusinessException;
import com.ordercraft.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class OrderServiceTest {

    @Mock
    private CustomerOrderRepository orderRepository;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private OrderStatusHistoryRepository historyRepository;

    @InjectMocks
    private CustomerOrderService orderService;

    private Customer customer;
    private Product product;

    @BeforeEach
    void setUp() {
        customer = new Customer("CUST-01", "Acme Industries", "acme@example.com", "555-0100", "City", "TAX-01");
        customer.setId(1L);

        product = new Product("PROD-01", "Machined Part", "Description", "PCS",
                BigDecimal.valueOf(100.00), BigDecimal.valueOf(60.00));
        product.setId(2L);
    }

    @Test
    void testCreateOrder_CalculatesTotalsAndSetsPending() {
        CustomerOrderRequest req = new CustomerOrderRequest();
        req.setCustomerId(1L);
        req.setOrderDate(LocalDate.now());

        CustomerOrderItemRequest itemReq = new CustomerOrderItemRequest();
        itemReq.setProductId(2L);
        itemReq.setQuantity(BigDecimal.valueOf(5));
        itemReq.setUnitPrice(BigDecimal.valueOf(100.00));
        req.setItems(List.of(itemReq));

        when(customerRepository.findById(1L)).thenReturn(Optional.of(customer));
        when(productRepository.findById(2L)).thenReturn(Optional.of(product));
        when(orderRepository.save(any(CustomerOrder.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CustomerOrder order = orderService.createOrder(req);

        assertNotNull(order);
        assertEquals(CustomerOrderStatus.PENDING, order.getStatus());
        assertEquals(0, new BigDecimal("500.00").compareTo(order.getTotalAmount()));
        assertEquals(1, order.getItems().size());
        verify(historyRepository, times(1)).save(any(OrderStatusHistory.class));
    }

    @Test
    void testUpdateOrderStatus_ValidTransition() {
        CustomerOrder order = new CustomerOrder("ORD-2026-0001", customer, LocalDate.now(), null, "Notes");
        order.setStatus(CustomerOrderStatus.PENDING);
        order.setId(10L);

        when(orderRepository.findById(10L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(CustomerOrder.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CustomerOrder updated = orderService.updateOrderStatus(10L, CustomerOrderStatus.CONFIRMED, "Approved by manager");

        assertEquals(CustomerOrderStatus.CONFIRMED, updated.getStatus());
        verify(historyRepository, times(1)).save(any(OrderStatusHistory.class));
    }

    @Test
    void testUpdateOrderStatus_InvalidTransitionThrowsException() {
        CustomerOrder order = new CustomerOrder("ORD-2026-0001", customer, LocalDate.now(), null, "Notes");
        order.setStatus(CustomerOrderStatus.PENDING);
        order.setId(10L);

        when(orderRepository.findById(10L)).thenReturn(Optional.of(order));

        // PENDING cannot jump directly to DELIVERED
        assertThrows(BusinessException.class, () ->
                orderService.updateOrderStatus(10L, CustomerOrderStatus.DELIVERED, "Direct delivery")
        );
    }
}
