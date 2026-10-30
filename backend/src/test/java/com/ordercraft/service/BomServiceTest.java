package com.ordercraft.service;

import com.ordercraft.dto.MaterialRequirementDto;
import com.ordercraft.entity.BomItem;
import com.ordercraft.entity.Product;
import com.ordercraft.entity.RawMaterial;
import com.ordercraft.repository.BomItemRepository;
import com.ordercraft.repository.ProductRepository;
import com.ordercraft.repository.RawMaterialRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class BomServiceTest {

    @Mock
    private BomItemRepository bomItemRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private RawMaterialRepository rawMaterialRepository;

    @InjectMocks
    private BomService bomService;

    private Product product;
    private RawMaterial steel;
    private RawMaterial aluminum;

    @BeforeEach
    void setUp() {
        product = new Product("PROD-01", "Hydraulic Actuator", "Description", "PCS",
                BigDecimal.valueOf(500), BigDecimal.valueOf(250));
        product.setId(1L);

        steel = new RawMaterial("RM-STEEL", "Structural Steel", "Desc", "KG",
                BigDecimal.valueOf(5.0), BigDecimal.valueOf(100.0), BigDecimal.valueOf(20.0), BigDecimal.valueOf(50.0));
        steel.setId(10L);

        aluminum = new RawMaterial("RM-ALUM", "Aluminum 6061", "Desc", "KG",
                BigDecimal.valueOf(10.0), BigDecimal.valueOf(15.0), BigDecimal.valueOf(20.0), BigDecimal.valueOf(30.0));
        aluminum.setId(20L);
    }

    @Test
    void testCalculateRequirements_SufficientAndShortage() {
        // Product needs 10 KG steel and 5 KG aluminum per unit
        BomItem item1 = new BomItem(product, steel, BigDecimal.valueOf(10.0), BigDecimal.ZERO, "Frame");
        BomItem item2 = new BomItem(product, aluminum, BigDecimal.valueOf(5.0), BigDecimal.ZERO, "Bracket");

        when(bomItemRepository.findByProductId(1L)).thenReturn(List.of(item1, item2));

        // To produce 5 units:
        // Steel required: 50 KG, available: 100 KG -> Sufficient
        // Aluminum required: 25 KG, available: 15 KG -> Shortage of 10 KG
        List<MaterialRequirementDto> requirements = bomService.calculateRequirements(1L, BigDecimal.valueOf(5));

        assertEquals(2, requirements.size());

        MaterialRequirementDto steelReq = requirements.stream()
                .filter(r -> r.getMaterialCode().equals("RM-STEEL")).findFirst().orElseThrow();
        assertEquals(new BigDecimal("50.00"), steelReq.getRequiredQuantity());
        assertFalse(steelReq.isShortage());
        assertEquals(BigDecimal.ZERO, steelReq.getShortageQuantity());

        MaterialRequirementDto alumReq = requirements.stream()
                .filter(r -> r.getMaterialCode().equals("RM-ALUM")).findFirst().orElseThrow();
        assertEquals(new BigDecimal("25.00"), alumReq.getRequiredQuantity());
        assertTrue(alumReq.isShortage());
        assertEquals(new BigDecimal("10.00"), alumReq.getShortageQuantity());
    }

    @Test
    void testCalculateRequirements_WithScrapPercentage() {
        // Steel with 10% scrap allowance
        BomItem item = new BomItem(product, steel, BigDecimal.valueOf(10.0), BigDecimal.valueOf(10.0), "Frame");
        when(bomItemRepository.findByProductId(1L)).thenReturn(List.of(item));

        // For 1 unit: 10 * 1.10 = 11.00 KG required
        List<MaterialRequirementDto> requirements = bomService.calculateRequirements(1L, BigDecimal.ONE);

        assertEquals(1, requirements.size());
        assertEquals(new BigDecimal("11.00"), requirements.get(0).getRequiredQuantity());
    }
}
