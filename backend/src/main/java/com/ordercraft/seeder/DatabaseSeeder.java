package com.ordercraft.seeder;

import com.ordercraft.dto.*;
import com.ordercraft.entity.*;
import com.ordercraft.repository.UserRepository;
import com.ordercraft.service.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DatabaseSeeder.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final CustomerService customerService;
    private final SupplierService supplierService;
    private final ProductService productService;
    private final RawMaterialService rawMaterialService;
    private final BomService bomService;
    private final CustomerOrderService orderService;
    private final ManufacturingService manufacturingService;
    private final PurchaseOrderService poService;
    private final InvoiceService invoiceService;
    private final PaymentService paymentService;

    public DatabaseSeeder(UserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          CustomerService customerService,
                          SupplierService supplierService,
                          ProductService productService,
                          RawMaterialService rawMaterialService,
                          BomService bomService,
                          CustomerOrderService orderService,
                          ManufacturingService manufacturingService,
                          PurchaseOrderService poService,
                          InvoiceService invoiceService,
                          PaymentService paymentService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.customerService = customerService;
        this.supplierService = supplierService;
        this.productService = productService;
        this.rawMaterialService = rawMaterialService;
        this.bomService = bomService;
        this.orderService = orderService;
        this.manufacturingService = manufacturingService;
        this.poService = poService;
        this.invoiceService = invoiceService;
        this.paymentService = paymentService;
    }

    @Override
    public void run(String... args) {
        if (!customerService.getAllActiveCustomers().isEmpty()) {
            logger.info("Database is already initialized. Skipping seed data.");
            return;
        }

        logger.info("Initializing OrderCraft baseline master data...");

        // 2. Customers
        CustomerDto c1 = new CustomerDto();
        c1.setCustomerCode("CUST-1001");
        c1.setName("Tata Motors Precision Systems Ltd");
        c1.setEmail("procurement@tatamotors-precision.co.in");
        c1.setPhone("+91 98220 11440");
        c1.setAddress("Plot C-12, MIDC Industrial Area, Chakan, Pune, Maharashtra 410501");
        c1.setTaxId("27AAACT2727Q1ZW");
        Customer cust1 = customerService.createCustomer(c1);

        CustomerDto c2 = new CustomerDto();
        c2.setCustomerCode("CUST-1002");
        c2.setName("Bharat Forge Advanced Engineering Ltd");
        c2.setEmail("orders@bharatforge-tech.com");
        c2.setPhone("+91 98450 78210");
        c2.setAddress("72 Mundhwa Industrial Corridor, Pune, Maharashtra 411036");
        c2.setTaxId("27AAACB1100P1Z3");
        Customer cust2 = customerService.createCustomer(c2);

        CustomerDto c3 = new CustomerDto();
        c3.setCustomerCode("CUST-1003");
        c3.setName("Larsen & Toubro Heavy Machinery Div");
        c3.setEmail("supply.chain@lnt-heavyeng.com");
        c3.setPhone("+91 99300 45612");
        c3.setAddress("Gate 5, Saki Vihar Road, Powai Works, Mumbai, Maharashtra 400072");
        c3.setTaxId("27AAACL0149E1ZP");
        Customer cust3 = customerService.createCustomer(c3);

        CustomerDto c4 = new CustomerDto();
        c4.setCustomerCode("CUST-1004");
        c4.setName("Mahindra Electric Mobility Ltd");
        c4.setEmail("vendor.ops@mahindraelectric.com");
        c4.setPhone("+91 98801 33200");
        c4.setAddress("Plot 14/15, Bommasandra Jigani Link Road, Bengaluru, Karnataka 560105");
        c4.setTaxId("29AABCM1234D1Z8");
        customerService.createCustomer(c4);

        // 3. Suppliers
        SupplierDto s1 = new SupplierDto();
        s1.setSupplierCode("SUP-2001");
        s1.setName("Jindal Steel & Power Ltd");
        s1.setContactPerson("Suresh Jindal");
        s1.setEmail("sales@jindalsteel-industrial.com");
        s1.setPhone("+91 97520 88200");
        s1.setAddress("Kharsia Road Industrial Complex, Raigarh, Chhattisgarh 496001");
        Supplier sup1 = supplierService.createSupplier(s1);

        SupplierDto s2 = new SupplierDto();
        s2.setSupplierCode("SUP-2002");
        s2.setName("Hindalco Aluminium Extrusions Ltd");
        s2.setContactPerson("Sunil Rathi");
        s2.setEmail("industrial.sales@hindalco-adityabirla.com");
        s2.setPhone("+91 94150 23145");
        s2.setAddress("Renukoot Industrial Estate, Sonebhadra, Uttar Pradesh 231217");
        Supplier sup2 = supplierService.createSupplier(s2);

        SupplierDto s3 = new SupplierDto();
        s3.setSupplierCode("SUP-2003");
        s3.setName("Havells Industrial Electricals Ltd");
        s3.setContactPerson("Vikram Malhotra");
        s3.setEmail("b2b.orders@havells-switchgear.com");
        s3.setPhone("+91 98110 56789");
        s3.setAddress("A-22, Phase-II, Okhla Industrial Area, New Delhi 110020");
        Supplier sup3 = supplierService.createSupplier(s3);

        SupplierDto s4 = new SupplierDto();
        s4.setSupplierCode("SUP-2004");
        s4.setName("Polycab Wires & Polymers Ltd");
        s4.setContactPerson("Ketan Patel");
        s4.setEmail("supply@polycab-industrial.in");
        s4.setPhone("+91 98250 90123");
        s4.setAddress("741/1 GIDC Industrial Estate, Halol, Vadodara, Gujarat 389350");
        supplierService.createSupplier(s4);

        // 4. Raw Materials (some with low stock to demonstrate alerts)
        RawMaterialDto rm1 = new RawMaterialDto();
        rm1.setMaterialCode("RM-STEEL-01");
        rm1.setName("Structural Alloy Steel Plate (6mm)");
        rm1.setDescription("Hot-rolled commercial structural steel plate for chassis & frames");
        rm1.setUnitOfMeasure("KG");
        rm1.setUnitCost(BigDecimal.valueOf(4.50));
        rm1.setCurrentStock(BigDecimal.valueOf(650.00));
        rm1.setMinStockLevel(BigDecimal.valueOf(200.00));
        rm1.setReorderLevel(BigDecimal.valueOf(300.00));
        RawMaterial matSteel = rawMaterialService.createMaterial(rm1);

        RawMaterialDto rm2 = new RawMaterialDto();
        rm2.setMaterialCode("RM-ALUM-02");
        rm2.setName("Aircraft Grade Aluminum 6061-T6");
        rm2.setDescription("Extruded high-strength lightweight aluminum bar");
        rm2.setUnitOfMeasure("KG");
        rm2.setUnitCost(BigDecimal.valueOf(8.20));
        rm2.setCurrentStock(BigDecimal.valueOf(140.00)); // Low stock (< 200)
        rm2.setMinStockLevel(BigDecimal.valueOf(150.00));
        rm2.setReorderLevel(BigDecimal.valueOf(200.00));
        RawMaterial matAlum = rawMaterialService.createMaterial(rm2);

        RawMaterialDto rm3 = new RawMaterialDto();
        rm3.setMaterialCode("RM-COPPER-03");
        rm3.setName("Oxygen-Free High Conductivity Copper 14AWG");
        rm3.setDescription("Ultra-low resistance wiring for high precision actuator coils");
        rm3.setUnitOfMeasure("METER");
        rm3.setUnitCost(BigDecimal.valueOf(2.75));
        rm3.setCurrentStock(BigDecimal.valueOf(820.00));
        rm3.setMinStockLevel(BigDecimal.valueOf(300.00));
        rm3.setReorderLevel(BigDecimal.valueOf(500.00));
        RawMaterial matCopper = rawMaterialService.createMaterial(rm3);

        RawMaterialDto rm4 = new RawMaterialDto();
        rm4.setMaterialCode("RM-POLY-04");
        rm4.setName("Impact-Resistant Thermoplastic Resin");
        rm4.setDescription("Reinforced engineering polymer for protective casings");
        rm4.setUnitOfMeasure("KG");
        rm4.setUnitCost(BigDecimal.valueOf(6.80));
        rm4.setCurrentStock(BigDecimal.valueOf(85.00)); // Low stock (< 150)
        rm4.setMinStockLevel(BigDecimal.valueOf(100.00));
        rm4.setReorderLevel(BigDecimal.valueOf(150.00));
        RawMaterial matPoly = rawMaterialService.createMaterial(rm4);

        RawMaterialDto rm5 = new RawMaterialDto();
        rm5.setMaterialCode("RM-CHIP-05");
        rm5.setName("STM32 Industrial Cortex-M4 Controller");
        rm5.setDescription("Automotive-grade 32-bit MCU with CAN-bus integration");
        rm5.setUnitOfMeasure("PCS");
        rm5.setUnitCost(BigDecimal.valueOf(14.50));
        rm5.setCurrentStock(BigDecimal.valueOf(380.00));
        rm5.setMinStockLevel(BigDecimal.valueOf(100.00));
        rm5.setReorderLevel(BigDecimal.valueOf(150.00));
        RawMaterial matChip = rawMaterialService.createMaterial(rm5);

        RawMaterialDto rm6 = new RawMaterialDto();
        rm6.setMaterialCode("RM-BOLT-06");
        rm6.setName("M8 High-Tensile Fastener Pack");
        rm6.setDescription("Grade 10.9 zinc-plated hex cap screw with nylon locknut");
        rm6.setUnitOfMeasure("SET");
        rm6.setUnitCost(BigDecimal.valueOf(1.25));
        rm6.setCurrentStock(BigDecimal.valueOf(1450.00));
        rm6.setMinStockLevel(BigDecimal.valueOf(400.00));
        rm6.setReorderLevel(BigDecimal.valueOf(600.00));
        RawMaterial matBolt = rawMaterialService.createMaterial(rm6);

        // 5. Products
        ProductDto p1 = new ProductDto();
        p1.setProductCode("PROD-ACT-01");
        p1.setName("Precision Industrial Actuator Assembly");
        p1.setDescription("High-torque brushless linear servo actuator for CNC tooling systems");
        p1.setUnitOfMeasure("PCS");
        p1.setSellingPrice(BigDecimal.valueOf(750.00));
        p1.setCostPrice(BigDecimal.valueOf(340.00));
        Product prodActuator = productService.createProduct(p1);

        ProductDto p2 = new ProductDto();
        p2.setProductCode("PROD-GRIP-02");
        p2.setName("Heavy-Duty Robotic Arm Gripper");
        p2.setDescription("Dual-finger pneumatic articulated gripper with force feedback");
        p2.setUnitOfMeasure("PCS");
        p2.setSellingPrice(BigDecimal.valueOf(1450.00));
        p2.setCostPrice(BigDecimal.valueOf(680.00));
        Product prodGripper = productService.createProduct(p2);

        ProductDto p3 = new ProductDto();
        p3.setProductCode("PROD-PUMP-03");
        p3.setName("Variable Displacement Coolant Pump");
        p3.setDescription("High-pressure multi-stage coolant recirculator with digital sensor");
        p3.setUnitOfMeasure("PCS");
        p3.setSellingPrice(BigDecimal.valueOf(520.00));
        p3.setCostPrice(BigDecimal.valueOf(240.00));
        Product prodPump = productService.createProduct(p3);

        // 6. Bills of Materials (BOM)
        // Actuator BOM
        addBomItem(prodActuator.getId(), matSteel.getId(), BigDecimal.valueOf(12.50), BigDecimal.valueOf(2.0), "Base mounting chassis");
        addBomItem(prodActuator.getId(), matAlum.getId(), BigDecimal.valueOf(4.00), BigDecimal.valueOf(1.5), "Slider arm rail");
        addBomItem(prodActuator.getId(), matChip.getId(), BigDecimal.valueOf(1.00), BigDecimal.ZERO, "Master servo controller");
        addBomItem(prodActuator.getId(), matBolt.getId(), BigDecimal.valueOf(16.00), BigDecimal.ZERO, "Assembly fasteners");

        // Gripper BOM
        addBomItem(prodGripper.getId(), matSteel.getId(), BigDecimal.valueOf(22.00), BigDecimal.valueOf(3.0), "Main gripper carriage");
        addBomItem(prodGripper.getId(), matAlum.getId(), BigDecimal.valueOf(8.50), BigDecimal.valueOf(2.0), "Articulated finger links");
        addBomItem(prodGripper.getId(), matPoly.getId(), BigDecimal.valueOf(5.00), BigDecimal.valueOf(1.0), "Anti-slip jaw pads");
        addBomItem(prodGripper.getId(), matChip.getId(), BigDecimal.valueOf(2.00), BigDecimal.ZERO, "Pneumatic valve driver");
        addBomItem(prodGripper.getId(), matBolt.getId(), BigDecimal.valueOf(28.00), BigDecimal.ZERO, "Structural fasteners");

        // Pump BOM
        addBomItem(prodPump.getId(), matAlum.getId(), BigDecimal.valueOf(6.50), BigDecimal.valueOf(2.0), "Impeller housing");
        addBomItem(prodPump.getId(), matCopper.getId(), BigDecimal.valueOf(35.00), BigDecimal.valueOf(5.0), "Motor stator winding");
        addBomItem(prodPump.getId(), matPoly.getId(), BigDecimal.valueOf(4.00), BigDecimal.valueOf(2.0), "End-cap seal gasket");
        addBomItem(prodPump.getId(), matBolt.getId(), BigDecimal.valueOf(10.00), BigDecimal.ZERO, "Casing bolts");

        // 7. Customer Orders with multiple line items
        // Order 1: Delivered & fully invoiced & fully paid
        CustomerOrderRequest ordReq1 = new CustomerOrderRequest();
        ordReq1.setCustomerId(cust1.getId());
        ordReq1.setOrderDate(LocalDate.now().minusDays(20));
        ordReq1.setDeliveryDate(LocalDate.now().minusDays(5));
        ordReq1.setNotes("Expedited production run for automotive tier-1 contract");
        ordReq1.setItems(List.of(
                createOrderItem(prodActuator.getId(), BigDecimal.valueOf(10), BigDecimal.valueOf(750.00)),
                createOrderItem(prodPump.getId(), BigDecimal.valueOf(5), BigDecimal.valueOf(520.00))
        ));
        CustomerOrder ord1 = orderService.createOrder(ordReq1);
        orderService.updateOrderStatus(ord1.getId(), CustomerOrderStatus.CONFIRMED, "Client PO received");
        orderService.updateOrderStatus(ord1.getId(), CustomerOrderStatus.IN_PRODUCTION, "Production order initiated");
        orderService.updateOrderStatus(ord1.getId(), CustomerOrderStatus.COMPLETED, "QA inspection passed");
        orderService.updateOrderStatus(ord1.getId(), CustomerOrderStatus.DELIVERED, "Delivered to Chakan works");

        // Generate Invoice for Order 1
        InvoiceRequest invReq1 = new InvoiceRequest();
        invReq1.setCustomerOrderId(ord1.getId());
        invReq1.setIssueDate(LocalDate.now().minusDays(10));
        invReq1.setDueDate(LocalDate.now().plusDays(20));
        invReq1.setTaxRate(BigDecimal.valueOf(10.00));
        invReq1.setNotes("Payment terms: Net 30");
        Invoice inv1 = invoiceService.generateInvoiceFromOrder(invReq1);

        // Record full payment for Invoice 1
        PaymentRequest payReq1 = new PaymentRequest();
        payReq1.setInvoiceId(inv1.getId());
        payReq1.setAmount(inv1.getTotalAmount());
        payReq1.setPaymentMethod(PaymentMethod.BANK_TRANSFER);
        payReq1.setPaymentDate(LocalDate.now().minusDays(3));
        payReq1.setReferenceNumber("RTGS/SBIN000456/778811");
        payReq1.setNotes("Full settlement via RTGS");
        paymentService.recordPayment(payReq1);

        // Order 2: In Production & partially invoiced
        CustomerOrderRequest ordReq2 = new CustomerOrderRequest();
        ordReq2.setCustomerId(cust2.getId());
        ordReq2.setOrderDate(LocalDate.now().minusDays(8));
        ordReq2.setDeliveryDate(LocalDate.now().plusDays(12));
        ordReq2.setNotes("Standard delivery for Mundhwa robotics facility");
        ordReq2.setItems(List.of(
                createOrderItem(prodGripper.getId(), BigDecimal.valueOf(6), BigDecimal.valueOf(1450.00))
        ));
        CustomerOrder ord2 = orderService.createOrder(ordReq2);
        orderService.updateOrderStatus(ord2.getId(), CustomerOrderStatus.CONFIRMED, "Order confirmation sent");
        orderService.updateOrderStatus(ord2.getId(), CustomerOrderStatus.IN_PRODUCTION, "Materials assigned");

        InvoiceRequest invReq2 = new InvoiceRequest();
        invReq2.setCustomerOrderId(ord2.getId());
        invReq2.setIssueDate(LocalDate.now().minusDays(4));
        invReq2.setDueDate(LocalDate.now().plusDays(26));
        invReq2.setTaxRate(BigDecimal.valueOf(18.00));
        invReq2.setNotes("GST 18% - Advance deposit invoiced");
        Invoice inv2 = invoiceService.generateInvoiceFromOrder(invReq2);

        // Record partial payment for Invoice 2 (partial payment)
        PaymentRequest payReq2 = new PaymentRequest();
        payReq2.setInvoiceId(inv2.getId());
        payReq2.setAmount(BigDecimal.valueOf(5000.00));
        payReq2.setPaymentMethod(PaymentMethod.BANK_TRANSFER);
        payReq2.setPaymentDate(LocalDate.now().minusDays(1));
        payReq2.setReferenceNumber("NEFT/HDFC0001234/987123");
        payReq2.setNotes("Partial deposit received via NEFT");
        paymentService.recordPayment(payReq2);

        // Order 3: Confirmed / Pending production
        CustomerOrderRequest ordReq3 = new CustomerOrderRequest();
        ordReq3.setCustomerId(cust3.getId());
        ordReq3.setOrderDate(LocalDate.now().minusDays(2));
        ordReq3.setDeliveryDate(LocalDate.now().plusDays(20));
        ordReq3.setNotes("Batch delivery of coolant circulation systems");
        ordReq3.setItems(List.of(
                createOrderItem(prodPump.getId(), BigDecimal.valueOf(12), BigDecimal.valueOf(520.00)),
                createOrderItem(prodActuator.getId(), BigDecimal.valueOf(4), BigDecimal.valueOf(750.00))
        ));
        CustomerOrder ord3 = orderService.createOrder(ordReq3);
        orderService.updateOrderStatus(ord3.getId(), CustomerOrderStatus.CONFIRMED, "Credit check verified");

        // 8. Manufacturing Orders
        // MO 1: Completed
        ManufacturingOrderRequest moReq1 = new ManufacturingOrderRequest();
        moReq1.setCustomerOrderId(ord1.getId());
        moReq1.setProductId(prodActuator.getId());
        moReq1.setTargetQuantity(BigDecimal.valueOf(10));
        moReq1.setStartDate(LocalDate.now().minusDays(18));
        moReq1.setNotes("Scheduled run on CNC workstation #3");
        ManufacturingOrder mo1 = manufacturingService.createManufacturingOrder(moReq1);
        manufacturingService.startProduction(mo1.getId());
        manufacturingService.completeProduction(mo1.getId());

        // MO 2: In-Progress (consumed materials from inventory)
        ManufacturingOrderRequest moReq2 = new ManufacturingOrderRequest();
        moReq2.setCustomerOrderId(ord2.getId());
        moReq2.setProductId(prodGripper.getId());
        moReq2.setTargetQuantity(BigDecimal.valueOf(4));
        moReq2.setStartDate(LocalDate.now().minusDays(5));
        moReq2.setNotes("Robotic arm gripper fabrication");
        ManufacturingOrder mo2 = manufacturingService.createManufacturingOrder(moReq2);
        manufacturingService.startProduction(mo2.getId());

        // MO 3: Planned (showing stock requirement verification)
        ManufacturingOrderRequest moReq3 = new ManufacturingOrderRequest();
        moReq3.setCustomerOrderId(ord3.getId());
        moReq3.setProductId(prodPump.getId());
        moReq3.setTargetQuantity(BigDecimal.valueOf(12));
        moReq3.setStartDate(LocalDate.now().plusDays(1));
        moReq3.setNotes("Planned for next Monday shift");
        manufacturingService.createManufacturingOrder(moReq3);

        // 9. Purchase Orders & Goods Receipts
        PurchaseOrderRequest poReq1 = new PurchaseOrderRequest();
        poReq1.setSupplierId(sup1.getId());
        poReq1.setOrderDate(LocalDate.now().minusDays(15));
        poReq1.setExpectedDeliveryDate(LocalDate.now().minusDays(3));
        poReq1.setNotes("Quarterly stock replenishment for structural alloys");
        poReq1.setItems(List.of(
                createPoItem(matSteel.getId(), BigDecimal.valueOf(500.00), BigDecimal.valueOf(4.50)),
                createPoItem(matAlum.getId(), BigDecimal.valueOf(250.00), BigDecimal.valueOf(8.20))
        ));
        PurchaseOrder po1 = poService.createPurchaseOrder(poReq1);
        poService.submitPurchaseOrder(po1.getId());

        // Receive PO 1 goods into stock
        GoodsReceiptRequest grReq1 = new GoodsReceiptRequest();
        grReq1.setPurchaseOrderId(po1.getId());
        grReq1.setReceiptDate(LocalDate.now().minusDays(4));
        grReq1.setNotes("Delivered via freight carrier. Inspection passed without defects.");
        grReq1.setItems(List.of(
                createGrItem(matSteel.getId(), BigDecimal.valueOf(500.00)),
                createGrItem(matAlum.getId(), BigDecimal.valueOf(250.00))
        ));
        poService.receiveGoods(grReq1);

        // PO 2: Submitted / pending delivery for low-stock materials
        PurchaseOrderRequest poReq2 = new PurchaseOrderRequest();
        poReq2.setSupplierId(sup2.getId());
        poReq2.setOrderDate(LocalDate.now().minusDays(2));
        poReq2.setExpectedDeliveryDate(LocalDate.now().plusDays(5));
        poReq2.setNotes("Urgent restock of engineering polymers");
        poReq2.setItems(List.of(
                createPoItem(matPoly.getId(), BigDecimal.valueOf(300.00), BigDecimal.valueOf(6.80))
        ));
        PurchaseOrder po2 = poService.createPurchaseOrder(poReq2);
        poService.submitPurchaseOrder(po2.getId());

        logger.info("OrderCraft demonstration data successfully seeded!");
    }

    private void addBomItem(Long prodId, Long matId, BigDecimal qty, BigDecimal scrap, String notes) {
        BomItemRequest req = new BomItemRequest();
        req.setProductId(prodId);
        req.setRawMaterialId(matId);
        req.setQuantityRequired(qty);
        req.setScrapPercentage(scrap);
        req.setNotes(notes);
        bomService.addBomItem(req);
    }

    private CustomerOrderItemRequest createOrderItem(Long prodId, BigDecimal qty, BigDecimal price) {
        CustomerOrderItemRequest item = new CustomerOrderItemRequest();
        item.setProductId(prodId);
        item.setQuantity(qty);
        item.setUnitPrice(price);
        return item;
    }

    private PurchaseOrderItemRequest createPoItem(Long matId, BigDecimal qty, BigDecimal price) {
        PurchaseOrderItemRequest item = new PurchaseOrderItemRequest();
        item.setRawMaterialId(matId);
        item.setOrderedQuantity(qty);
        item.setUnitPrice(price);
        return item;
    }

    private GoodsReceiptItemRequest createGrItem(Long matId, BigDecimal qty) {
        GoodsReceiptItemRequest item = new GoodsReceiptItemRequest();
        item.setRawMaterialId(matId);
        item.setQuantityReceived(qty);
        return item;
    }
}
