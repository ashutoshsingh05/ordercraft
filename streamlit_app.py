import streamlit as st
import sqlite3
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime, date, timedelta
import os

# ==============================================================================
# 1. PAGE CONFIGURATION & ENTERPRISE STYLING
# ==============================================================================
st.set_page_config(
    page_title="OrderCraft — Manufacturing ERP",
    page_icon="⚙️",
    layout="wide",
    initial_sidebar_state="expanded"
)

st.markdown("""
<style>
    .metric-card {
        background-color: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        margin-bottom: 15px;
    }
    .badge-success { background-color: #dcfce7; color: #166534; padding: 3px 8px; border-radius: 6px; font-weight: bold; font-size: 12px; }
    .badge-warning { background-color: #fef3c7; color: #92400e; padding: 3px 8px; border-radius: 6px; font-weight: bold; font-size: 12px; }
    .badge-info { background-color: #e0f2fe; color: #075985; padding: 3px 8px; border-radius: 6px; font-weight: bold; font-size: 12px; }
    .badge-danger { background-color: #fee2e2; color: #991b1b; padding: 3px 8px; border-radius: 6px; font-weight: bold; font-size: 12px; }
    .badge-secondary { background-color: #f1f5f9; color: #475569; padding: 3px 8px; border-radius: 6px; font-weight: bold; font-size: 12px; }
    div[data-testid="stSidebarHeader"] { padding-top: 1rem; }
</style>
""", unsafe_allow_html=True)

# ==============================================================================
# 2. DATABASE INITIALIZATION & PRE-SEEDED RECORDS
# ==============================================================================
DB_FILE = "ordercraft.db"

def get_db():
    conn = sqlite3.connect(DB_FILE, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    c = conn.cursor()
    
    # Users
    c.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        full_name TEXT,
        role TEXT
    )""")
    
    # Customers
    c.execute("""
    CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_code TEXT UNIQUE,
        name TEXT,
        email TEXT,
        phone TEXT,
        address TEXT,
        tax_id TEXT,
        active INTEGER DEFAULT 1
    )""")
    
    # Suppliers
    c.execute("""
    CREATE TABLE IF NOT EXISTS suppliers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        supplier_code TEXT UNIQUE,
        name TEXT,
        contact_person TEXT,
        email TEXT,
        phone TEXT,
        address TEXT,
        lead_time_days INTEGER,
        payment_terms TEXT,
        active INTEGER DEFAULT 1
    )""")
    
    # Products
    c.execute("""
    CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_code TEXT UNIQUE,
        name TEXT,
        description TEXT,
        unit_of_measure TEXT,
        unit_price REAL,
        active INTEGER DEFAULT 1
    )""")
    
    # Raw Materials
    c.execute("""
    CREATE TABLE IF NOT EXISTS raw_materials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        material_code TEXT UNIQUE,
        name TEXT,
        description TEXT,
        unit_of_measure TEXT,
        unit_cost REAL,
        current_stock REAL,
        min_stock_level REAL,
        reorder_level REAL,
        active INTEGER DEFAULT 1
    )""")
    
    # Bill of Materials (BOM)
    c.execute("""
    CREATE TABLE IF NOT EXISTS bom_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER,
        raw_material_id INTEGER,
        quantity_required REAL,
        scrap_percentage REAL DEFAULT 0,
        notes TEXT,
        FOREIGN KEY (product_id) REFERENCES products (id),
        FOREIGN KEY (raw_material_id) REFERENCES raw_materials (id)
    )""")
    
    # Customer Orders
    c.execute("""
    CREATE TABLE IF NOT EXISTS customer_orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_number TEXT UNIQUE,
        customer_id INTEGER,
        order_date TEXT,
        delivery_date TEXT,
        status TEXT,
        total_amount REAL,
        invoiced INTEGER DEFAULT 0,
        notes TEXT,
        FOREIGN KEY (customer_id) REFERENCES customers (id)
    )""")
    
    # Customer Order Items
    c.execute("""
    CREATE TABLE IF NOT EXISTS customer_order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER,
        product_id INTEGER,
        quantity REAL,
        unit_price REAL,
        subtotal REAL,
        FOREIGN KEY (order_id) REFERENCES customer_orders (id),
        FOREIGN KEY (product_id) REFERENCES products (id)
    )""")
    
    # Manufacturing Orders
    c.execute("""
    CREATE TABLE IF NOT EXISTS manufacturing_orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mo_number TEXT UNIQUE,
        customer_order_id INTEGER,
        product_id INTEGER,
        quantity_to_produce REAL,
        status TEXT,
        start_date TEXT,
        completion_date TEXT,
        materials_issued INTEGER DEFAULT 0,
        notes TEXT,
        FOREIGN KEY (customer_order_id) REFERENCES customer_orders (id),
        FOREIGN KEY (product_id) REFERENCES products (id)
    )""")
    
    # Purchase Orders
    c.execute("""
    CREATE TABLE IF NOT EXISTS purchase_orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        po_number TEXT UNIQUE,
        supplier_id INTEGER,
        order_date TEXT,
        expected_delivery_date TEXT,
        status TEXT,
        total_amount REAL,
        notes TEXT,
        FOREIGN KEY (supplier_id) REFERENCES suppliers (id)
    )""")
    
    # Purchase Order Items
    c.execute("""
    CREATE TABLE IF NOT EXISTS purchase_order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        po_id INTEGER,
        raw_material_id INTEGER,
        quantity REAL,
        unit_price REAL,
        subtotal REAL,
        FOREIGN KEY (po_id) REFERENCES purchase_orders (id),
        FOREIGN KEY (raw_material_id) REFERENCES raw_materials (id)
    )""")
    
    # Invoices
    c.execute("""
    CREATE TABLE IF NOT EXISTS invoices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_number TEXT UNIQUE,
        customer_order_id INTEGER,
        invoice_date TEXT,
        due_date TEXT,
        subtotal REAL,
        tax_amount REAL,
        total_amount REAL,
        paid_amount REAL DEFAULT 0,
        outstanding_balance REAL,
        status TEXT,
        FOREIGN KEY (customer_order_id) REFERENCES customer_orders (id)
    )""")
    
    # Payments
    c.execute("""
    CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        payment_number TEXT UNIQUE,
        invoice_id INTEGER,
        amount REAL,
        payment_date TEXT,
        payment_method TEXT,
        reference_number TEXT,
        notes TEXT,
        FOREIGN KEY (invoice_id) REFERENCES invoices (id)
    )""")
    
    # Inventory Transactions Ledger
    c.execute("""
    CREATE TABLE IF NOT EXISTS inventory_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        raw_material_id INTEGER,
        transaction_type TEXT,
        quantity REAL,
        stock_before REAL,
        stock_after REAL,
        reference_number TEXT,
        notes TEXT,
        created_at TEXT,
        FOREIGN KEY (raw_material_id) REFERENCES raw_materials (id)
    )""")
    
    # Check if demo seed data is needed
    c.execute("SELECT COUNT(*) FROM users")
    if c.fetchone()[0] == 0:
        # Seed users
        c.execute("INSERT INTO users (username, password, full_name, role) VALUES ('admin', 'admin123', 'Eleanor Vance (Operations Director)', 'ROLE_ADMIN')")
        c.execute("INSERT INTO users (username, password, full_name, role) VALUES ('staff', 'staff123', 'Marcus Chen (Shop Floor Supervisor)', 'ROLE_STAFF')")
        
        # Seed Customers
        c.execute("INSERT INTO customers (customer_code, name, email, phone, address, tax_id) VALUES ('CUST-1001', 'Apex Robotics Dynamics', 'procurement@apexrobotics.com', '+1 (312) 555-0192', '440 Industrial Parkway, Chicago, IL 60607', 'US-EIN-9482711')")
        c.execute("INSERT INTO customers (customer_code, name, email, phone, address, tax_id) VALUES ('CUST-1002', 'NexaTech Industrial Systems', 'orders@nexatech.com', '+1 (313) 555-0144', '1200 Assembly Row, Detroit, MI 48226', 'US-EIN-3829104')")
        c.execute("INSERT INTO customers (customer_code, name, email, phone, address, tax_id) VALUES ('CUST-1003', 'Sterling Automotive Corp', 'supply@sterlingauto.com', '+1 (216) 555-0188', '750 Foundry Way, Cleveland, OH 44114', 'US-EIN-5520931')")
        
        # Seed Suppliers
        c.execute("INSERT INTO suppliers (supplier_code, name, contact_person, email, phone, address, lead_time_days, payment_terms) VALUES ('SUP-501', 'Vanguard Alloys & Metals', 'Robert Sterling', 'sales@vanguardalloys.com', '+1 (412) 555-0130', '100 Steel Mill Rd, Pittsburgh, PA 15201', 5, 'Net 30')")
        c.execute("INSERT INTO suppliers (supplier_code, name, contact_person, email, phone, address, lead_time_days, payment_terms) VALUES ('SUP-502', 'Precision Polymer Solutions', 'Claire Zhang', 'claire@precisionpoly.com', '+1 (330) 555-0177', '240 Polymer Blvd, Akron, OH 44308', 7, 'Net 15')")
        c.execute("INSERT INTO suppliers (supplier_code, name, contact_person, email, phone, address, lead_time_days, payment_terms) VALUES ('SUP-503', 'Apex MicroElectronics Inc', 'David Chen', 'orders@apexmicro.com', '+1 (408) 555-0199', '88 Silicon Expressway, San Jose, CA 95134', 10, 'Net 45')")
        
        # Seed Raw Materials
        c.execute("INSERT INTO raw_materials (material_code, name, description, unit_of_measure, unit_cost, current_stock, min_stock_level, reorder_level) VALUES ('RM-ALUM-01', 'Aircraft-Grade 6061 Aluminum Billet', 'High-strength structural aluminum', 'KG', 12.50, 480.0, 100.0, 200.0)")
        c.execute("INSERT INTO raw_materials (material_code, name, description, unit_of_measure, unit_cost, current_stock, min_stock_level, reorder_level) VALUES ('RM-STEL-02', '316L Stainless Steel Rod Stock', 'Corrosion-resistant marine alloy', 'KG', 18.20, 290.0, 50.0, 120.0)")
        c.execute("INSERT INTO raw_materials (material_code, name, description, unit_of_measure, unit_cost, current_stock, min_stock_level, reorder_level) VALUES ('RM-ELEC-03', 'Brushless DC Servomotor Core', 'Precision high-torque rotary core', 'PCS', 45.00, 120.0, 20.0, 40.0)")
        c.execute("INSERT INTO raw_materials (material_code, name, description, unit_of_measure, unit_cost, current_stock, min_stock_level, reorder_level) VALUES ('RM-POLY-04', 'Impact Thermoplastic Resin', 'Reinforced engineering polymer for casings', 'KG', 6.80, 64.8, 100.0, 150.0)")
        
        # Seed Products
        c.execute("INSERT INTO products (product_code, name, description, unit_of_measure, unit_price) VALUES ('PRD-ACT-100', 'Precision Robotic Linear Actuator', 'High-accuracy motorized servo actuator', 'UNIT', 520.00)")
        c.execute("INSERT INTO products (product_code, name, description, unit_of_measure, unit_price) VALUES ('PRD-GRP-200', 'Pneumatic Robotic Gripper Assembly', 'Heavy-duty 2-jaw industrial manipulator', 'UNIT', 380.00)")
        c.execute("INSERT INTO products (product_code, name, description, unit_of_measure, unit_price) VALUES ('PRD-PMP-300', 'High-Pressure Hydraulic Gear Pump', 'Variable displacement fluid pump', 'UNIT', 840.00)")
        
        # Seed BOMs
        c.execute("INSERT INTO bom_items (product_id, raw_material_id, quantity_required, scrap_percentage, notes) VALUES (1, 1, 2.5, 5.0, 'Milled actuator housing')")
        c.execute("INSERT INTO bom_items (product_id, raw_material_id, quantity_required, scrap_percentage, notes) VALUES (1, 3, 1.0, 0.0, 'Internal drive servomotor')")
        c.execute("INSERT INTO bom_items (product_id, raw_material_id, quantity_required, scrap_percentage, notes) VALUES (2, 2, 1.8, 4.0, 'Gripper fingers and hinge')")
        c.execute("INSERT INTO bom_items (product_id, raw_material_id, quantity_required, scrap_percentage, notes) VALUES (2, 4, 0.8, 2.0, 'Protective sensor shroud')")
        
        # Seed Customer Orders
        c.execute("INSERT INTO customer_orders (order_number, customer_id, order_date, delivery_date, status, total_amount, invoiced, notes) VALUES ('ORD-2026-0001', 1, '2026-10-10', '2026-10-25', 'DELIVERED', 10400.00, 1, 'Expedited tier-1 robotics batch')")
        c.execute("INSERT INTO customer_order_items (order_id, product_id, quantity, unit_price, subtotal) VALUES (1, 1, 20, 520.00, 10400.00)")
        
        c.execute("INSERT INTO customer_orders (order_number, customer_id, order_date, delivery_date, status, total_amount, invoiced, notes) VALUES ('ORD-2026-0002', 2, '2026-10-22', '2026-11-10', 'IN_PRODUCTION', 7600.00, 1, 'Standard assembly batch')")
        c.execute("INSERT INTO customer_order_items (order_id, product_id, quantity, unit_price, subtotal) VALUES (2, 2, 20, 380.00, 7600.00)")
        
        c.execute("INSERT INTO customer_orders (order_number, customer_id, order_date, delivery_date, status, total_amount, invoiced, notes) VALUES ('ORD-2026-0003', 3, '2026-10-28', '2026-11-18', 'CONFIRMED', 8400.00, 0, 'Coolant pump batch')")
        c.execute("INSERT INTO customer_order_items (order_id, product_id, quantity, unit_price, subtotal) VALUES (3, 3, 10, 840.00, 8400.00)")
        
        # Seed Manufacturing Orders
        c.execute("INSERT INTO manufacturing_orders (mo_number, customer_order_id, product_id, quantity_to_produce, status, start_date, completion_date, materials_issued, notes) VALUES ('MO-2026-0001', 1, 1, 20, 'COMPLETED', '2026-10-12', '2026-10-22', 1, 'Finished on schedule')")
        c.execute("INSERT INTO manufacturing_orders (mo_number, customer_order_id, product_id, quantity_to_produce, status, start_date, completion_date, materials_issued, notes) VALUES ('MO-2026-0002', 2, 2, 20, 'IN_PROGRESS', '2026-10-24', NULL, 1, 'Assembly line 2')")
        
        # Seed Purchase Orders
        c.execute("INSERT INTO purchase_orders (po_number, supplier_id, order_date, expected_delivery_date, status, total_amount, notes) VALUES ('PO-2026-0001', 1, '2026-10-05', '2026-10-12', 'RECEIVED', 6250.00, 'Raw aluminum billets')")
        c.execute("INSERT INTO purchase_order_items (po_id, raw_material_id, quantity, unit_price, subtotal) VALUES (1, 1, 500, 12.50, 6250.00)")
        
        # Seed Invoices
        c.execute("INSERT INTO invoices (invoice_number, customer_order_id, invoice_date, due_date, subtotal, tax_amount, total_amount, paid_amount, outstanding_balance, status) VALUES ('INV-2026-0001', 1, '2026-10-25', '2026-11-24', 10400.00, 520.00, 10920.00, 10920.00, 0.00, 'PAID')")
        c.execute("INSERT INTO invoices (invoice_number, customer_order_id, invoice_date, due_date, subtotal, tax_amount, total_amount, paid_amount, outstanding_balance, status) VALUES ('INV-2026-0002', 2, '2026-10-26', '2026-11-25', 7600.00, 380.00, 7980.00, 3500.00, 4480.00, 'PARTIALLY_PAID')")
        
        # Seed Payments
        c.execute("INSERT INTO payments (payment_number, invoice_id, amount, payment_date, payment_method, reference_number, notes) VALUES ('PAY-2026-0001', 1, 10920.00, '2026-10-28', 'BANK_TRANSFER', 'WIRE-98210', 'Full contract settlement')")
        c.execute("INSERT INTO payments (payment_number, invoice_id, amount, payment_date, payment_method, reference_number, notes) VALUES ('PAY-2026-0002', 2, 3500.00, '2026-10-29', 'CREDIT_CARD', 'CC-49102', 'Initial 50% milestone payment')")
        
        # Seed Transaction Ledger
        c.execute("INSERT INTO inventory_transactions (raw_material_id, transaction_type, quantity, stock_before, stock_after, reference_number, notes, created_at) VALUES (1, 'PURCHASE_RECEIPT', 500.0, 32.5, 532.5, 'PO-2026-0001', 'Goods received from Vanguard Alloys', '2026-10-12 14:30:00')")
        c.execute("INSERT INTO inventory_transactions (raw_material_id, transaction_type, quantity, stock_before, stock_after, reference_number, notes, created_at) VALUES (1, 'PRODUCTION_ISSUE', 52.5, 532.5, 480.0, 'MO-2026-0001', 'Issued for 20 units of PRD-ACT-100', '2026-10-12 16:00:00')")

    conn.commit()
    conn.close()

init_db()

# ==============================================================================
# 3. AUTHENTICATION & SESSION STATE
# ==============================================================================
if "user" not in st.session_state:
    st.session_state["user"] = None

def login(username, password):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM users WHERE username = ? AND password = ?", (username, password))
    user = c.fetchone()
    conn.close()
    if user:
        st.session_state["user"] = dict(user)
        return True
    return False

def logout():
    st.session_state["user"] = None

# If not logged in, display login screen
if not st.session_state["user"]:
    st.markdown("<h2 style='text-align: center; color: #1e3a8a;'>⚙️ OrderCraft ERP</h2>", unsafe_allow_html=True)
    st.markdown("<p style='text-align: center; color: #64748b;'>Manufacturing Order Management & Floor Execution System</p>", unsafe_allow_html=True)
    
    col1, col2, col3 = st.columns([1, 1.2, 1])
    with col2:
        with st.form("login_form"):
            st.subheader("Account Sign In")
            u = st.text_input("Username", value="admin")
            p = st.text_input("Password", type="password", value="admin123")
            submitted = st.form_submit_button("Sign In to OrderCraft", use_container_width=True)
            if submitted:
                if login(u, p):
                    st.success("Authentication successful!")
                    st.rerun()
                else:
                    st.error("Invalid username or password.")
        
        st.info("💡 **Demo Credentials:**\n- **Admin:** `admin` / `admin123`\n- **Staff:** `staff` / `staff123`")
    st.stop()

# ==============================================================================
# 4. SIDEBAR NAVIGATION & USER INFO
# ==============================================================================
user = st.session_state.get("user") or {"full_name": "Guest", "role": "ROLE_GUEST"}
with st.sidebar:
    st.markdown("## ⚙️ **OrderCraft**")
    st.caption("Manufacturing ERP & Supply Chain")
    st.divider()
    
    st.markdown(f"👤 **{user['full_name']}**")
    st.caption(f"Role: `{user['role']}`")
    
    menu = st.radio(
        "Navigation",
        [
            "📊 Executive Dashboard",
            "🛒 Customer Sales Orders",
            "👥 Customer Accounts",
            "⚙️ Production Orders (MO)",
            "📦 Products & BOM Recipe",
            "🧱 Raw Materials & Inventory",
            "🚚 Procurement & POs",
            "🏭 Supplier Directory",
            "📑 Invoices & Receivables",
            "💳 Payments & Settlements",
            "📈 Reports & CSV Exports"
        ]
    )
    
    st.divider()
    if st.button("Sign Out", use_container_width=True):
        logout()
        st.rerun()

# ==============================================================================
# 5. MODULE: EXECUTIVE DASHBOARD
# ==============================================================================
if menu == "📊 Executive Dashboard":
    st.title("Operational & Financial Overview")
    st.caption("Live metrics, production progress, and cash flow intelligence")
    
    conn = get_db()
    # Metrics
    total_orders = conn.execute("SELECT COUNT(*) FROM customer_orders").fetchone()[0]
    in_prod_orders = conn.execute("SELECT COUNT(*) FROM customer_orders WHERE status = 'IN_PRODUCTION'").fetchone()[0]
    total_invoiced = conn.execute("SELECT COALESCE(SUM(total_amount), 0) FROM invoices").fetchone()[0]
    total_collected = conn.execute("SELECT COALESCE(SUM(paid_amount), 0) FROM invoices").fetchone()[0]
    outstanding = conn.execute("SELECT COALESCE(SUM(outstanding_balance), 0) FROM invoices").fetchone()[0]
    low_stock = conn.execute("SELECT COUNT(*) FROM raw_materials WHERE current_stock <= reorder_level").fetchone()[0]
    
    k1, k2, k3, k4 = st.columns(4)
    k1.metric("Total Sales Orders", total_orders, f"{in_prod_orders} in active shop production")
    k2.metric("Total Invoiced Revenue", f"${total_invoiced:,.2f}", f"${total_collected:,.2f} collected")
    k3.metric("Outstanding Receivables", f"${outstanding:,.2f}", "Pending customer payments")
    k4.metric("Low Stock Alerts", low_stock, "Items below reorder point" if low_stock > 0 else "All optimal", delta_color="inverse")
    
    st.divider()
    
    # Charts Row
    c1, c2 = st.columns([1.5, 1])
    with c1:
        st.subheader("Monthly Revenue Trend")
        rev_data = pd.DataFrame({
            "Month": ["May 2026", "Jun 2026", "Jul 2026", "Aug 2026", "Sep 2026", "Oct 2026"],
            "Revenue": [0, 0, 0, 0, 0, total_invoiced]
        })
        fig_rev = px.bar(rev_data, x="Month", y="Revenue", text_auto="$,.0f", title="Invoiced Volume ($)", color_discrete_sequence=["#3b82f6"])
        fig_rev.update_layout(height=300, margin=dict(l=20, r=20, t=30, b=20))
        st.plotly_chart(fig_rev, use_container_width=True)
        
    with c2:
        st.subheader("Order Workflow Status")
        status_df = pd.read_sql_query("SELECT status, COUNT(*) as count FROM customer_orders GROUP BY status", conn)
        fig_pie = px.pie(status_df, values="count", names="status", hole=0.5, title="Sales Order Distribution",
                         color_discrete_sequence=["#f59e0b", "#3b82f6", "#10b981", "#64748b", "#ef4444"])
        fig_pie.update_layout(height=300, margin=dict(l=20, r=20, t=30, b=20))
        st.plotly_chart(fig_pie, use_container_width=True)
        
    # Recent Orders & Low Stock Tables
    t1, t2 = st.columns([1.5, 1])
    with t1:
        st.subheader("Recent Customer Orders")
        orders_df = pd.read_sql_query("""
        SELECT co.order_number as 'Order #', c.name as 'Customer', co.order_date as 'Date', co.status as 'Status', '$' || printf('%.2f', co.total_amount) as 'Amount'
        FROM customer_orders co
        JOIN customers c ON co.customer_id = c.id
        ORDER BY co.id DESC LIMIT 5
        """, conn)
        st.dataframe(orders_df, use_container_width=True, hide_index=True)
        
    with t2:
        st.subheader("Critical Stock Warnings")
        low_stock_df = pd.read_sql_query("""
        SELECT material_code as 'Code', name as 'Material', current_stock || ' ' || unit_of_measure as 'Available', reorder_level || ' ' || unit_of_measure as 'Reorder'
        FROM raw_materials
        WHERE current_stock <= reorder_level
        """, conn)
        if not low_stock_df.empty:
            st.dataframe(low_stock_df, use_container_width=True, hide_index=True)
        else:
            st.success("All raw material stock levels are within safe parameters.")
    conn.close()

# ==============================================================================
# 6. MODULE: CUSTOMER SALES ORDERS
# ==============================================================================
elif menu == "🛒 Customer Sales Orders":
    st.title("Customer Sales Orders")
    st.caption("Manage customer multi-line order dispatch, line pricing, and status workflows")
    
    conn = get_db()
    
    with st.expander("+ Create New Customer Sales Order", expanded=False):
        with st.form("new_order_form"):
            customers = conn.execute("SELECT id, name, customer_code FROM customers WHERE active = 1").fetchall()
            products = conn.execute("SELECT id, name, unit_price FROM products WHERE active = 1").fetchall()
            
            c_col1, c_col2 = st.columns(2)
            c_select = c_col1.selectbox("Customer Account", options=[c["id"] for c in customers], format_func=lambda x: next(c["name"] for c in customers if c["id"] == x))
            order_date = c_col2.date_input("Order Date", value=date.today())
            delivery_date = c_col2.date_input("Target Delivery Date", value=date.today() + timedelta(days=14))
            notes = c_col1.text_input("Commercial Notes", placeholder="e.g. Standard manufacturing batch 1")
            
            st.markdown("##### Order Product Lines")
            p_select = st.selectbox("Product Line", options=[p["id"] for p in products], format_func=lambda x: next(f"{p['name']} (${p['unit_price']})" for p in products if p["id"] == x))
            p_qty = st.number_input("Order Quantity", min_value=1, value=10)
            
            submit_order = st.form_submit_button("Book Sales Order", use_container_width=True)
            if submit_order:
                chosen_p = next(p for p in products if p["id"] == p_select)
                total = p_qty * chosen_p["unit_price"]
                ord_num = f"ORD-2026-{datetime.now().strftime('%M%S')}"
                
                cur = conn.cursor()
                cur.execute("INSERT INTO customer_orders (order_number, customer_id, order_date, delivery_date, status, total_amount, notes) VALUES (?, ?, ?, ?, 'PENDING', ?, ?)",
                            (ord_num, c_select, str(order_date), str(delivery_date), total, notes))
                ord_id = cur.lastrowid
                cur.execute("INSERT INTO customer_order_items (order_id, product_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)",
                            (ord_id, p_select, p_qty, chosen_p["unit_price"], total))
                conn.commit()
                st.success(f"Sales Order **{ord_num}** successfully created for ${total:,.2f}!")
                st.rerun()

    # Filters
    tab_choice = st.radio("Filter Status:", ["ALL", "PENDING", "CONFIRMED", "IN_PRODUCTION", "COMPLETED", "DELIVERED"], horizontal=True)
    
    query = """
    SELECT co.id, co.order_number, c.name as customer_name, co.order_date, co.delivery_date, co.status, co.total_amount, co.invoiced
    FROM customer_orders co
    JOIN customers c ON co.customer_id = c.id
    """
    if tab_choice != "ALL":
        query += f" WHERE co.status = '{tab_choice}'"
    query += " ORDER BY co.id DESC"
    
    orders = conn.execute(query).fetchall()
    
    for o in orders:
        with st.container(border=True):
            col_info, col_act = st.columns([3, 2])
            with col_info:
                st.markdown(f"### **{o['order_number']}** — {o['customer_name']}")
                st.markdown(f"📅 Ordered: `{o['order_date']}` | Due: `{o['delivery_date'] or 'N/A'}` | Value: **${o['total_amount']:,.2f}**")
                st.markdown(f"Status: `{o['status']}` | Invoiced: `{'YES' if o['invoiced'] else 'NO'}`")
            
            with col_act:
                st.write("**Workflow Action:**")
                act_cols = st.columns(3)
                if o['status'] == 'PENDING':
                    if act_cols[0].button("Confirm", key=f"conf_{o['id']}"):
                        conn.execute("UPDATE customer_orders SET status = 'CONFIRMED' WHERE id = ?", (o['id'],))
                        conn.commit()
                        st.rerun()
                elif o['status'] == 'CONFIRMED':
                    if act_cols[0].button("Start Prod", key=f"prod_{o['id']}"):
                        conn.execute("UPDATE customer_orders SET status = 'IN_PRODUCTION' WHERE id = ?", (o['id'],))
                        conn.commit()
                        st.rerun()
                elif o['status'] == 'IN_PRODUCTION':
                    if act_cols[0].button("Complete", key=f"comp_{o['id']}"):
                        conn.execute("UPDATE customer_orders SET status = 'COMPLETED' WHERE id = ?", (o['id'],))
                        conn.commit()
                        st.rerun()
                elif o['status'] == 'COMPLETED':
                    if act_cols[0].button("Deliver", key=f"del_{o['id']}"):
                        conn.execute("UPDATE customer_orders SET status = 'DELIVERED' WHERE id = ?", (o['id'],))
                        conn.commit()
                        st.rerun()
                        
                if not o['invoiced'] and o['status'] in ['IN_PRODUCTION', 'COMPLETED', 'DELIVERED']:
                    if act_cols[1].button("Create Invoice", key=f"inv_{o['id']}"):
                        inv_num = f"INV-2026-{datetime.now().strftime('%M%S')}"
                        subtot = o['total_amount']
                        tax = round(subtot * 0.05, 2)
                        grand_tot = subtot + tax
                        due_date = str(date.today() + timedelta(days=30))
                        conn.execute("INSERT INTO invoices (invoice_number, customer_order_id, invoice_date, due_date, subtotal, tax_amount, total_amount, paid_amount, outstanding_balance, status) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, 'ISSUED')",
                                     (inv_num, o['id'], str(date.today()), due_date, subtot, tax, grand_tot, grand_tot))
                        conn.execute("UPDATE customer_orders SET invoiced = 1 WHERE id = ?", (o['id'],))
                        conn.commit()
                        st.success(f"Generated Invoice **{inv_num}**!")
                        st.rerun()
    conn.close()

# ==============================================================================
# 7. MODULE: MANUFACTURING ORDERS & BOM EXECUTION
# ==============================================================================
elif menu == "⚙️ Production Orders (MO)":
    st.title("Manufacturing & Shop Floor Execution")
    st.caption("Schedule jobs, deduct BOM materials, check shortages, and record finished goods")
    
    conn = get_db()
    with st.expander("+ Schedule New Production Job", expanded=False):
        with st.form("new_mo_form"):
            orders = conn.execute("SELECT id, order_number FROM customer_orders").fetchall()
            products = conn.execute("SELECT id, name, product_code FROM products WHERE active = 1").fetchall()
            
            m1, m2 = st.columns(2)
            ord_sel = m1.selectbox("Sales Order Reference", options=[o["id"] for o in orders], format_func=lambda x: next(o["order_number"] for o in orders if o["id"] == x))
            prod_sel = m2.selectbox("Product to Make", options=[p["id"] for p in products], format_func=lambda x: next(f"{p['name']} ({p['product_code']})" for p in products if p["id"] == x))
            qty = m1.number_input("Batch Quantity to Produce", min_value=1, value=10)
            instructions = m2.text_input("Floor Notes", placeholder="e.g. Workstation Line 2")
            
            if st.form_submit_button("Schedule Job", use_container_width=True):
                mo_num = f"MO-2026-{datetime.now().strftime('%M%S')}"
                conn.execute("INSERT INTO manufacturing_orders (mo_number, customer_order_id, product_id, quantity_to_produce, status, notes) VALUES (?, ?, ?, ?, 'PLANNED', ?)",
                             (mo_num, ord_sel, prod_sel, qty, instructions))
                conn.commit()
                st.success(f"Production Job **{mo_num}** successfully scheduled!")
                st.rerun()

    mos = conn.execute("""
    SELECT mo.id, mo.mo_number, co.order_number, p.name as prod_name, p.id as prod_id, mo.quantity_to_produce, mo.status, mo.materials_issued
    FROM manufacturing_orders mo
    JOIN customer_orders co ON mo.customer_order_id = co.id
    JOIN products p ON mo.product_id = p.id
    ORDER BY mo.id DESC
    """).fetchall()
    
    for mo in mos:
        with st.container(border=True):
            i1, i2 = st.columns([3, 2])
            with i1:
                st.markdown(f"### **{mo['mo_number']}** — {mo['prod_name']}")
                st.markdown(f"Order Ref: `{mo['order_number']}` | Quantity: **{mo['quantity_to_produce']} units**")
                st.markdown(f"Status: `{mo['status']}` | BOM Stock Deducted: `{'YES' if mo['materials_issued'] else 'PENDING'}`")
            
            with i2:
                # Shortage check
                if st.button("Check Stock Shortages", key=f"chk_{mo['id']}"):
                    boms = conn.execute("SELECT rm.name, rm.material_code, bi.quantity_required, rm.current_stock, rm.unit_of_measure FROM bom_items bi JOIN raw_materials rm ON bi.raw_material_id = rm.id WHERE bi.product_id = ?", (mo['prod_id'],)).fetchall()
                    st.write("**BOM Requirements Check:**")
                    for b in boms:
                        needed = b['quantity_required'] * mo['quantity_to_produce']
                        avail = b['current_stock']
                        shortage = max(0.0, needed - avail)
                        if shortage > 0:
                            st.error(f"❌ {b['name']}: Need {needed} {b['unit_of_measure']}, Avail: {avail}. Shortage: {shortage}")
                        else:
                            st.success(f"✅ {b['name']}: Need {needed} {b['unit_of_measure']}, Avail: {avail} (Sufficient)")
                            
                if mo['status'] == 'PLANNED':
                    if st.button("Start Production (Issue BOM)", key=f"start_{mo['id']}", type="primary"):
                        # Deduct raw materials
                        boms = conn.execute("SELECT raw_material_id, quantity_required FROM bom_items WHERE product_id = ?", (mo['prod_id'],)).fetchall()
                        for b in boms:
                            needed = b['quantity_required'] * mo['quantity_to_produce']
                            cur_stock = conn.execute("SELECT current_stock FROM raw_materials WHERE id = ?", (b['raw_material_id'],)).fetchone()[0]
                            new_stock = max(0.0, cur_stock - needed)
                            conn.execute("UPDATE raw_materials SET current_stock = ? WHERE id = ?", (new_stock, b['raw_material_id']))
                            conn.execute("INSERT INTO inventory_transactions (raw_material_id, transaction_type, quantity, stock_before, stock_after, reference_number, notes, created_at) VALUES (?, 'PRODUCTION_ISSUE', ?, ?, ?, ?, ?, ?)",
                                         (b['raw_material_id'], needed, cur_stock, new_stock, mo['mo_number'], f"Issued for batch {mo['mo_number']}", datetime.now().strftime("%Y-%m-%d %H:%M:%S")))
                        conn.execute("UPDATE manufacturing_orders SET status = 'IN_PROGRESS', materials_issued = 1, start_date = ? WHERE id = ?", (str(date.today()), mo['id']))
                        conn.commit()
                        st.success(f"Started job {mo['mo_number']} & deducted raw material components from warehouse inventory.")
                        st.rerun()
                elif mo['status'] == 'IN_PROGRESS':
                    if st.button("Complete Job", key=f"fin_{mo['id']}", type="primary"):
                        conn.execute("UPDATE manufacturing_orders SET status = 'COMPLETED', completion_date = ? WHERE id = ?", (str(date.today()), mo['id']))
                        conn.commit()
                        st.success(f"Production Job {mo['mo_number']} marked COMPLETED!")
                        st.rerun()
    conn.close()

# ==============================================================================
# 8. MODULE: PRODUCTS & BILL OF MATERIALS (BOM)
# ==============================================================================
elif menu == "📦 Products & BOM Recipe":
    st.title("Manufactured Products & Bill of Materials")
    st.caption("Engineered products catalogue, multi-level components, scrap allowances, and requirement simulations")
    
    conn = get_db()
    with st.expander("+ Add Manufactured Product", expanded=False):
        with st.form("new_prod_form"):
            p1, p2 = st.columns(2)
            code = p1.text_input("Product Code", placeholder="e.g. PRD-MOT-500")
            name = p2.text_input("Product Name", placeholder="e.g. High-Torque Servo")
            desc = p1.text_area("Engineering Description")
            price = p2.number_input("Selling Price ($)", min_value=0.0, value=250.0, step=10.0)
            uom = p2.text_input("Unit of Measure", value="UNIT")
            if st.form_submit_button("Save Product"):
                conn.execute("INSERT INTO products (product_code, name, description, unit_price, unit_of_measure) VALUES (?, ?, ?, ?, ?)",
                             (code, name, desc, price, uom))
                conn.commit()
                st.success("Product added to master catalogue!")
                st.rerun()

    prods = conn.execute("SELECT * FROM products").fetchall()
    for p in prods:
        with st.container(border=True):
            st.markdown(f"### **{p['name']}** (`{p['product_code']}`)")
            st.markdown(f"Description: *{p['description']}* | Selling Price: **${p['unit_price']:,.2f}** | UoM: `{p['unit_of_measure']}`")
            
            # BOM Items
            boms = conn.execute("""
            SELECT bi.id, rm.material_code, rm.name as material_name, bi.quantity_required, rm.unit_of_measure, bi.scrap_percentage, bi.notes
            FROM bom_items bi
            JOIN raw_materials rm ON bi.raw_material_id = rm.id
            WHERE bi.product_id = ?
            """, (p['id'],)).fetchall()
            
            if boms:
                st.write("**BOM Recipe Components:**")
                b_df = pd.DataFrame([dict(b) for b in boms])
                st.dataframe(b_df[["material_code", "material_name", "quantity_required", "unit_of_measure", "scrap_percentage", "notes"]], hide_index=True, use_container_width=True)
            else:
                st.info("No raw material components linked to this product yet.")
                
            # Add BOM Item
            with st.expander(f"+ Add Raw Material Component to {p['product_code']}"):
                with st.form(f"add_bom_{p['id']}"):
                    rms = conn.execute("SELECT id, name, material_code, unit_of_measure FROM raw_materials").fetchall()
                    rm_sel = st.selectbox("Select Raw Material", options=[r["id"] for r in rms], format_func=lambda x: next(f"{r['name']} ({r['material_code']})" for r in rms if r["id"] == x))
                    b_qty = st.number_input("Qty Required per Unit", min_value=0.01, value=1.0, step=0.1)
                    scrap = st.number_input("Scrap Allowance (%)", min_value=0.0, value=0.0, step=1.0)
                    b_notes = st.text_input("Component Notes", placeholder="e.g. Primary structural casing")
                    if st.form_submit_button("Add Component"):
                        conn.execute("INSERT INTO bom_items (product_id, raw_material_id, quantity_required, scrap_percentage, notes) VALUES (?, ?, ?, ?, ?)",
                                     (p['id'], rm_sel, b_qty, scrap, b_notes))
                        conn.commit()
                        st.success("Component linked to BOM!")
                        st.rerun()
    conn.close()

# ==============================================================================
# 9. MODULE: RAW MATERIALS & INVENTORY
# ==============================================================================
elif menu == "🧱 Raw Materials & Inventory":
    st.title("Raw Materials & Stock Movement Ledger")
    st.caption("Warehouse stock balances, reorder safety thresholds, and audit logging")
    
    conn = get_db()
    with st.expander("+ Register Raw Material in Inventory", expanded=False):
        with st.form("new_rm_form"):
            r1, r2 = st.columns(2)
            code = r1.text_input("Material Code", placeholder="e.g. RM-COP-05")
            name = r2.text_input("Material Name", placeholder="e.g. Electrolytic Copper Wire")
            desc = r1.text_area("Technical Description")
            cost = r2.number_input("Standard Unit Cost ($)", min_value=0.01, value=8.50)
            uom = r1.text_input("Unit of Measure", value="KG")
            init_stock = r2.number_input("Initial Stock Balance", min_value=0.0, value=100.0)
            reorder = r1.number_input("Reorder Threshold", min_value=0.0, value=50.0)
            min_stock = r2.number_input("Minimum Safety Stock", min_value=0.0, value=20.0)
            if st.form_submit_button("Save Raw Material"):
                cur = conn.cursor()
                cur.execute("INSERT INTO raw_materials (material_code, name, description, unit_of_measure, unit_cost, current_stock, min_stock_level, reorder_level) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                            (code, name, desc, uom, cost, init_stock, min_stock, reorder))
                rm_id = cur.lastrowid
                cur.execute("INSERT INTO inventory_transactions (raw_material_id, transaction_type, quantity, stock_before, stock_after, reference_number, notes, created_at) VALUES (?, 'INITIAL', ?, 0, ?, 'INITIAL-COUNT', 'Warehouse baseline setup', ?)",
                            (rm_id, init_stock, init_stock, datetime.now().strftime("%Y-%m-%d %H:%M:%S")))
                conn.commit()
                st.success("Raw material registered and stock logged!")
                st.rerun()

    # View materials
    rms_df = pd.read_sql_query("""
    SELECT id, material_code as 'Code', name as 'Material', description as 'Description', '$' || printf('%.2f', unit_cost) as 'Cost',
           current_stock || ' ' || unit_of_measure as 'In Stock', reorder_level || ' ' || unit_of_measure as 'Reorder',
           CASE WHEN current_stock <= reorder_level THEN '⚠️ LOW STOCK' ELSE '✅ HEALTHY' END as 'Status'
    FROM raw_materials
    """, conn)
    st.dataframe(rms_df, use_container_width=True, hide_index=True)
    
    # Stock Adjustment Form
    st.subheader("Physical Count Reconciliation / Adjustment")
    with st.form("adjust_stock_form"):
        adj1, adj2, adj3 = st.columns(3)
        rms = conn.execute("SELECT id, name, material_code, current_stock, unit_of_measure FROM raw_materials").fetchall()
        rm_choice = adj1.selectbox("Material to Adjust", options=[r["id"] for r in rms], format_func=lambda x: next(f"{r['name']} ({r['material_code']}) - Avail: {r['current_stock']}" for r in rms if r["id"] == x))
        adj_type = adj2.selectbox("Action", ["ADD (+)", "SUBTRACT (-)"])
        adj_qty = adj3.number_input("Quantity", min_value=0.01, value=10.0)
        adj_notes = st.text_input("Audit Reason", placeholder="e.g. Physical inventory cycle count reconciliation")
        if st.form_submit_button("Commit Stock Adjustment", use_container_width=True):
            chosen = next(r for r in rms if r["id"] == rm_choice)
            before = chosen["current_stock"]
            after = before + adj_qty if adj_type == "ADD (+)" else max(0.0, before - adj_qty)
            tx_type = "ADJUSTMENT_ADD" if adj_type == "ADD (+)" else "ADJUSTMENT_SUB"
            conn.execute("UPDATE raw_materials SET current_stock = ? WHERE id = ?", (after, rm_choice))
            conn.execute("INSERT INTO inventory_transactions (raw_material_id, transaction_type, quantity, stock_before, stock_after, reference_number, notes, created_at) VALUES (?, ?, ?, ?, ?, 'CYCLE-COUNT', ?, ?)",
                         (rm_choice, tx_type, adj_qty, before, after, adj_notes, datetime.now().strftime("%Y-%m-%d %H:%M:%S")))
            conn.commit()
            st.success(f"Adjusted stock for **{chosen['name']}**: {before} → {after}")
            st.rerun()

    # Movement Ledger
    st.subheader("Recent Inventory Transaction Audit Log")
    tx_df = pd.read_sql_query("""
    SELECT t.created_at as 'Timestamp', rm.material_code as 'Code', rm.name as 'Material', t.transaction_type as 'Type',
           t.quantity as 'Qty', t.stock_before as 'Before', t.stock_after as 'After', t.reference_number as 'Reference', t.notes as 'Notes'
    FROM inventory_transactions t
    JOIN raw_materials rm ON t.raw_material_id = rm.id
    ORDER BY t.id DESC LIMIT 15
    """, conn)
    st.dataframe(tx_df, use_container_width=True, hide_index=True)
    conn.close()

# ==============================================================================
# 10. MODULE: PROCUREMENT & PURCHASE ORDERS
# ==============================================================================
elif menu == "🚚 Procurement & POs":
    st.title("Procurement & Vendor Purchase Orders")
    st.caption("Manage supplier purchase contracts and replenish warehouse inventory via goods receiving")
    
    conn = get_db()
    with st.expander("+ Create Vendor Purchase Order", expanded=False):
        with st.form("new_po_form"):
            suppliers = conn.execute("SELECT id, name, supplier_code FROM suppliers WHERE active = 1").fetchall()
            rms = conn.execute("SELECT id, name, unit_cost, unit_of_measure FROM raw_materials WHERE active = 1").fetchall()
            
            p1, p2 = st.columns(2)
            supp_sel = p1.selectbox("Vendor", options=[s["id"] for s in suppliers], format_func=lambda x: next(f"{s['name']} ({s['supplier_code']})" for s in suppliers if s["id"] == x))
            order_date = p2.date_input("PO Date", value=date.today())
            delivery_date = p2.date_input("Expected Delivery", value=date.today() + timedelta(days=7))
            notes = p1.text_input("Purchase Notes", placeholder="e.g. Bulk alloy procurement")
            
            rm_sel = st.selectbox("Raw Material Line", options=[r["id"] for r in rms], format_func=lambda x: next(f"{r['name']} (${r['unit_cost']}/{r['unit_of_measure']})" for r in rms if r["id"] == x))
            qty = st.number_input("Order Quantity", min_value=1.0, value=100.0)
            
            if st.form_submit_button("Draft Purchase Order"):
                chosen_rm = next(r for r in rms if r["id"] == rm_sel)
                tot = qty * chosen_rm["unit_cost"]
                po_num = f"PO-2026-{datetime.now().strftime('%M%S')}"
                cur = conn.cursor()
                cur.execute("INSERT INTO purchase_orders (po_number, supplier_id, order_date, expected_delivery_date, status, total_amount, notes) VALUES (?, ?, ?, ?, 'DRAFT', ?, ?)",
                            (po_num, supp_sel, str(order_date), str(delivery_date), tot, notes))
                po_id = cur.lastrowid
                cur.execute("INSERT INTO purchase_order_items (po_id, raw_material_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)",
                            (po_id, rm_sel, qty, chosen_rm["unit_cost"], tot))
                conn.commit()
                st.success(f"Purchase Order **{po_num}** drafted for ${tot:,.2f}!")
                st.rerun()

    pos = conn.execute("""
    SELECT po.id, po.po_number, s.name as supplier_name, po.order_date, po.status, po.total_amount,
           poi.raw_material_id, rm.name as material_name, poi.quantity
    FROM purchase_orders po
    JOIN suppliers s ON po.supplier_id = s.id
    JOIN purchase_order_items poi ON po.id = poi.po_id
    JOIN raw_materials rm ON poi.raw_material_id = rm.id
    ORDER BY po.id DESC
    """).fetchall()
    
    for po in pos:
        with st.container(border=True):
            col_info, col_act = st.columns([3, 2])
            with col_info:
                st.markdown(f"### **{po['po_number']}** — {po['supplier_name']}")
                st.markdown(f"Material: **{po['quantity']} units** of `{po['material_name']}` | Total: **${po['total_amount']:,.2f}**")
                st.markdown(f"Order Date: `{po['order_date']}` | Status: `{po['status']}`")
            with col_act:
                if po['status'] == 'DRAFT':
                    if st.button("Submit to Vendor", key=f"sub_po_{po['id']}"):
                        conn.execute("UPDATE purchase_orders SET status = 'SUBMITTED' WHERE id = ?", (po['id'],))
                        conn.commit()
                        st.success(f"PO {po['po_number']} submitted!")
                        st.rerun()
                elif po['status'] == 'SUBMITTED':
                    if st.button("Receive Inbound Goods", key=f"rec_po_{po['id']}", type="primary"):
                        # Replenish stock
                        cur_stock = conn.execute("SELECT current_stock FROM raw_materials WHERE id = ?", (po['raw_material_id'],)).fetchone()[0]
                        new_stock = cur_stock + po['quantity']
                        conn.execute("UPDATE raw_materials SET current_stock = ? WHERE id = ?", (new_stock, po['raw_material_id']))
                        conn.execute("INSERT INTO inventory_transactions (raw_material_id, transaction_type, quantity, stock_before, stock_after, reference_number, notes, created_at) VALUES (?, 'PURCHASE_RECEIPT', ?, ?, ?, ?, 'Received goods shipment', ?)",
                                     (po['raw_material_id'], po['quantity'], cur_stock, new_stock, po['po_number'], datetime.now().strftime("%Y-%m-%d %H:%M:%S")))
                        conn.execute("UPDATE purchase_orders SET status = 'RECEIVED' WHERE id = ?", (po['id'],))
                        conn.commit()
                        st.success(f"Goods received for {po['po_number']}! Stock replenished.")
                        st.rerun()
    conn.close()

# ==============================================================================
# 11. MODULE: CUSTOMERS & SUPPLIERS DIRECTORY
# ==============================================================================
elif menu == "👥 Customer Accounts":
    st.title("Customer Accounts Directory")
    conn = get_db()
    with st.expander("+ Register New Customer", expanded=False):
        with st.form("new_cust"):
            c1, c2 = st.columns(2)
            code = c1.text_input("Customer Code", placeholder="CUST-1004")
            name = c2.text_input("Company Name")
            email = c1.text_input("Email")
            phone = c2.text_input("Phone")
            addr = c1.text_area("Address")
            tax = c2.text_input("Tax ID / EIN")
            if st.form_submit_button("Register Customer"):
                conn.execute("INSERT INTO customers (customer_code, name, email, phone, address, tax_id) VALUES (?, ?, ?, ?, ?, ?)",
                             (code, name, email, phone, addr, tax))
                conn.commit()
                st.success("Customer account registered!")
                st.rerun()
    cust_df = pd.read_sql_query("SELECT customer_code as 'Code', name as 'Customer Name', email as 'Email', phone as 'Phone', address as 'Address', tax_id as 'Tax ID' FROM customers", conn)
    st.dataframe(cust_df, use_container_width=True, hide_index=True)
    conn.close()

elif menu == "🏭 Supplier Directory":
    st.title("Vendor & Supplier Directory")
    conn = get_db()
    with st.expander("+ Register New Supplier", expanded=False):
        with st.form("new_supp"):
            s1, s2 = st.columns(2)
            code = s1.text_input("Supplier Code", placeholder="SUP-504")
            name = s2.text_input("Company Name")
            contact = s1.text_input("Contact Person")
            email = s2.text_input("Email")
            phone = s1.text_input("Phone")
            terms = s2.text_input("Payment Terms", value="Net 30")
            lead = s1.number_input("Lead Time (Days)", min_value=1, value=7)
            addr = s2.text_area("Address")
            if st.form_submit_button("Register Vendor"):
                conn.execute("INSERT INTO suppliers (supplier_code, name, contact_person, email, phone, address, lead_time_days, payment_terms) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                             (code, name, contact, email, phone, addr, lead, terms))
                conn.commit()
                st.success("Vendor registered!")
                st.rerun()
    supp_df = pd.read_sql_query("SELECT supplier_code as 'Code', name as 'Vendor Name', contact_person as 'Contact', email as 'Email', phone as 'Phone', lead_time_days || ' days' as 'Lead Time', payment_terms as 'Terms' FROM suppliers", conn)
    st.dataframe(supp_df, use_container_width=True, hide_index=True)
    conn.close()

# ==============================================================================
# 12. MODULE: INVOICES & PAYMENTS
# ==============================================================================
elif menu == "📑 Invoices & Receivables":
    st.title("Customer Invoices & Accounts Receivable")
    conn = get_db()
    invs = conn.execute("""
    SELECT i.id, i.invoice_number, co.order_number, c.name as customer_name, i.invoice_date, i.due_date,
           i.subtotal, i.tax_amount, i.total_amount, i.paid_amount, i.outstanding_balance, i.status
    FROM invoices i
    JOIN customer_orders co ON i.customer_order_id = co.id
    JOIN customers c ON co.customer_id = c.id
    ORDER BY i.id DESC
    """).fetchall()
    
    for inv in invs:
        with st.container(border=True):
            col_i, col_p = st.columns([3, 2])
            with col_i:
                st.markdown(f"### **{inv['invoice_number']}** — {inv['customer_name']}")
                st.markdown(f"Ref Order: `{inv['order_number']}` | Date: `{inv['invoice_date']}` | Due: `{inv['due_date']}`")
                st.markdown(f"Subtotal: **${inv['subtotal']:,.2f}** | Tax (5%): **${inv['tax_amount']:,.2f}** | Total: **${inv['total_amount']:,.2f}**")
                st.markdown(f"Paid: <span style='color:green;'>**${inv['paid_amount']:,.2f}**</span> | Outstanding: <span style='color:red;'>**${inv['outstanding_balance']:,.2f}**</span>", unsafe_allow_html=True)
            with col_p:
                if inv['outstanding_balance'] > 0:
                    st.write("**Instant Settlement:**")
                    if st.button("Settle Full Balance", key=f"pay_full_{inv['id']}", type="primary"):
                        bal = inv['outstanding_balance']
                        pay_num = f"PAY-2026-{datetime.now().strftime('%M%S')}"
                        conn.execute("INSERT INTO payments (payment_number, invoice_id, amount, payment_date, payment_method, reference_number, notes) VALUES (?, ?, ?, ?, 'BANK_TRANSFER', ?, 'Full settlement recorded')",
                                     (pay_num, inv['id'], bal, str(date.today()), f"REF-{datetime.now().strftime('%M%S')}"))
                        conn.execute("UPDATE invoices SET paid_amount = paid_amount + ?, outstanding_balance = 0.0, status = 'PAID' WHERE id = ?", (bal, inv['id']))
                        conn.commit()
                        st.success(f"Settled invoice {inv['invoice_number']} for ${bal:,.2f}!")
                        st.rerun()
    conn.close()

elif menu == "💳 Payments & Settlements":
    st.title("Cash Receipts & Payments Ledger")
    conn = get_db()
    with st.expander("+ Record Inbound Payment", expanded=False):
        with st.form("new_pay"):
            open_invs = conn.execute("SELECT id, invoice_number, outstanding_balance FROM invoices WHERE outstanding_balance > 0").fetchall()
            if open_invs:
                inv_sel = st.selectbox("Open Invoice", options=[i["id"] for i in open_invs], format_func=lambda x: next(f"{i['invoice_number']} (Balance: ${i['outstanding_balance']:,.2f})" for i in open_invs if i["id"] == x))
                chosen_inv = next(i for i in open_invs if i["id"] == inv_sel)
                amt = st.number_input("Payment Amount ($)", min_value=1.0, max_value=float(chosen_inv["outstanding_balance"]), value=float(chosen_inv["outstanding_balance"]))
                mthd = st.selectbox("Payment Method", ["BANK_TRANSFER", "CREDIT_CARD", "CHECK", "CASH"])
                ref = st.text_input("Wire / Check Ref #", placeholder="e.g. WIRE-84920")
                if st.form_submit_button("Post Payment"):
                    p_num = f"PAY-2026-{datetime.now().strftime('%M%S')}"
                    conn.execute("INSERT INTO payments (payment_number, invoice_id, amount, payment_date, payment_method, reference_number) VALUES (?, ?, ?, ?, ?, ?)",
                                 (p_num, inv_sel, amt, str(date.today()), mthd, ref))
                    new_bal = chosen_inv["outstanding_balance"] - amt
                    status = "PAID" if new_bal == 0 else "PARTIALLY_PAID"
                    conn.execute("UPDATE invoices SET paid_amount = paid_amount + ?, outstanding_balance = ?, status = ? WHERE id = ?",
                                 (amt, new_bal, status, inv_sel))
                    conn.commit()
                    st.success(f"Payment {p_num} posted against {chosen_inv['invoice_number']}!")
                    st.rerun()
            else:
                st.info("No open unpaid invoices found.")
                st.form_submit_button("Done", disabled=True)
                
    pays_df = pd.read_sql_query("""
    SELECT p.payment_number as 'Receipt #', i.invoice_number as 'Invoice #', p.payment_date as 'Date', p.payment_method as 'Method',
           '$' || printf('%.2f', p.amount) as 'Amount Received', p.reference_number as 'Reference'
    FROM payments p
    JOIN invoices i ON p.invoice_id = i.id
    ORDER BY p.id DESC
    """, conn)
    st.dataframe(pays_df, use_container_width=True, hide_index=True)
    conn.close()

# ==============================================================================
# 13. MODULE: OPERATIONAL REPORTS & CSV EXPORTS
# ==============================================================================
elif menu == "📈 Reports & CSV Exports":
    st.title("Operational Reports & CSV Data Exports")
    st.caption("Generate instant export files for audit and accounting reconciliation")
    
    conn = get_db()
    r1, r2 = st.columns(2)
    
    with r1:
        st.subheader("Sales Orders Ledger")
        df_ord = pd.read_sql_query("SELECT * FROM customer_orders", conn)
        st.download_button("Download Orders CSV", df_ord.to_csv(index=False), "customer_orders_export.csv", "text/csv", use_container_width=True)
        
        st.subheader("Invoices & Billing Ledger")
        df_inv = pd.read_sql_query("SELECT * FROM invoices", conn)
        st.download_button("Download Invoices CSV", df_inv.to_csv(index=False), "invoices_export.csv", "text/csv", use_container_width=True)
        
    with r2:
        st.subheader("Warehouse Inventory Report")
        df_rm = pd.read_sql_query("SELECT * FROM raw_materials", conn)
        st.download_button("Download Inventory CSV", df_rm.to_csv(index=False), "warehouse_inventory_export.csv", "text/csv", use_container_width=True)
        
        st.subheader("Payment Transactions Ledger")
        df_pay = pd.read_sql_query("SELECT * FROM payments", conn)
        st.download_button("Download Payments CSV", df_pay.to_csv(index=False), "cash_payments_export.csv", "text/csv", use_container_width=True)
    conn.close()
