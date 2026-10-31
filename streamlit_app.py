import streamlit as st
import sqlite3
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime, date, timedelta
import os

# ==============================================================================
# 1. PAGE CONFIGURATION & ENTERPRISE STYLING (INDIAN INDUSTRIAL ERP)
# ==============================================================================
st.set_page_config(
    page_title="OrderCraft India — Manufacturing ERP",
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
# 2. DATABASE INITIALIZATION & PRE-SEEDED INDIAN INDUSTRIAL RECORDS
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
        # Seed users (Indian Industrial Leadership)
        c.execute("INSERT INTO users (username, password, full_name, role) VALUES ('admin', 'admin123', 'Rajesh Sharma (Managing Director & Operations Head)', 'ROLE_ADMIN')")
        c.execute("INSERT INTO users (username, password, full_name, role) VALUES ('staff', 'staff123', 'Pooja Verma (Plant & Shop Floor Supervisor)', 'ROLE_STAFF')")
        
        # Seed Customers (Major Indian Manufacturing Hubs & OEMs with GSTIN)
        c.execute("INSERT INTO customers (customer_code, name, email, phone, address, tax_id) VALUES ('CUST-1001', 'Tata Motors Precision Systems Ltd', 'procurement@tatamotors-precision.co.in', '+91 98220 11440', 'Plot C-12, MIDC Industrial Area, Chakan, Pune, Maharashtra 410501', '27AAACT2727Q1ZW')")
        c.execute("INSERT INTO customers (customer_code, name, email, phone, address, tax_id) VALUES ('CUST-1002', 'Bharat Forge Advanced Engineering Ltd', 'orders@bharatforge-tech.com', '+91 98450 78210', '72 Mundhwa Industrial Corridor, Pune, Maharashtra 411036', '27AAACB1100P1Z3')")
        c.execute("INSERT INTO customers (customer_code, name, email, phone, address, tax_id) VALUES ('CUST-1003', 'Larsen & Toubro Heavy Machinery Div', 'supply.chain@lnt-heavyeng.com', '+91 99300 45612', 'Gate 5, Saki Vihar Road, Powai Works, Mumbai, Maharashtra 400072', '27AAACL0149E1ZP')")
        c.execute("INSERT INTO customers (customer_code, name, email, phone, address, tax_id) VALUES ('CUST-1004', 'Mahindra Electric Mobility Ltd', 'vendor.ops@mahindraelectric.com', '+91 98801 33200', 'Plot 14/15, Bommasandra Jigani Link Road, Bengaluru, Karnataka 560105', '29AABCM1234D1Z8')")
        
        # Seed Suppliers (Indian Industrial Material Giants)
        c.execute("INSERT INTO suppliers (supplier_code, name, contact_person, email, phone, address, lead_time_days, payment_terms) VALUES ('SUP-501', 'Jindal Steel & Power Ltd', 'Suresh Jindal', 'sales@jindalsteel-industrial.com', '+91 97520 88200', 'Kharsia Road Industrial Complex, Raigarh, Chhattisgarh 496001', 5, 'Net 30 Days (RTGS)')")
        c.execute("INSERT INTO suppliers (supplier_code, name, contact_person, email, phone, address, lead_time_days, payment_terms) VALUES ('SUP-502', 'Hindalco Aluminium Extrusions Ltd', 'Sunil Rathi', 'industrial.sales@hindalco-adityabirla.com', '+91 94150 23145', 'Renukoot Industrial Estate, Sonebhadra, Uttar Pradesh 231217', 7, 'Net 15 Days (NEFT)')")
        c.execute("INSERT INTO suppliers (supplier_code, name, contact_person, email, phone, address, lead_time_days, payment_terms) VALUES ('SUP-503', 'Havells Industrial Electricals Ltd', 'Vikram Malhotra', 'b2b.orders@havells-switchgear.com', '+91 98110 56789', 'A-22, Phase-II, Okhla Industrial Area, New Delhi 110020', 4, '100% Advance via NEFT')")
        c.execute("INSERT INTO suppliers (supplier_code, name, contact_person, email, phone, address, lead_time_days, payment_terms) VALUES ('SUP-504', 'Polycab Wires & Polymers Ltd', 'Ketan Patel', 'supply@polycab-industrial.in', '+91 98250 90123', '741/1 GIDC Industrial Estate, Halol, Vadodara, Gujarat 389350', 6, 'Net 45 Days')")
        
        # Seed Raw Materials (Prices in INR ₹)
        c.execute("INSERT INTO raw_materials (material_code, name, description, unit_of_measure, unit_cost, current_stock, min_stock_level, reorder_level) VALUES ('RM-ALUM-01', 'Aircraft 6061-T6 Aluminum Ingots', 'High-tensile structural extruded aluminum billet', 'KG', 285.00, 480.0, 100.0, 200.0)")
        c.execute("INSERT INTO raw_materials (material_code, name, description, unit_of_measure, unit_cost, current_stock, min_stock_level, reorder_level) VALUES ('RM-STEL-02', 'SS316L Industrial Stainless Steel Bar', 'Corrosion-resistant marine & auto grade steel', 'KG', 440.00, 290.0, 50.0, 120.0)")
        c.execute("INSERT INTO raw_materials (material_code, name, description, unit_of_measure, unit_cost, current_stock, min_stock_level, reorder_level) VALUES ('RM-SERV-03', 'High-Torque BLDC Servo Drive Motor', 'Automotive grade 48V closed-loop servomotor', 'PCS', 4200.00, 120.0, 20.0, 40.0)")
        c.execute("INSERT INTO raw_materials (material_code, name, description, unit_of_measure, unit_cost, current_stock, min_stock_level, reorder_level) VALUES ('RM-POLY-04', 'Impact Thermoplastic Polymer Granules', 'Glass-fiber reinforced engineering resin for enclosures', 'KG', 185.00, 64.8, 100.0, 150.0)")
        
        # Seed Products (Prices in INR ₹)
        c.execute("INSERT INTO products (product_code, name, description, unit_of_measure, unit_price) VALUES ('PRD-ACT-100', 'Heavy-Duty Precision CNC Linear Actuator', 'High-precision motorized servo actuator for CNC machineries', 'UNIT', 28500.00)")
        c.execute("INSERT INTO products (product_code, name, description, unit_of_measure, unit_price) VALUES ('PRD-GRP-200', 'Pneumatic Robotic 2-Jaw Manipulator Gripper', 'Heavy-duty articulated factory robotic arm gripper', 'UNIT', 19800.00)")
        c.execute("INSERT INTO products (product_code, name, description, unit_of_measure, unit_price) VALUES ('PRD-PMP-300', 'High-Pressure Industrial Hydraulic Gear Pump', 'Variable displacement fluid power hydraulic pump', 'UNIT', 44500.00)")
        
        # Seed BOMs
        c.execute("INSERT INTO bom_items (product_id, raw_material_id, quantity_required, scrap_percentage, notes) VALUES (1, 1, 2.5, 5.0, 'Precision milled CNC actuator chassis')")
        c.execute("INSERT INTO bom_items (product_id, raw_material_id, quantity_required, scrap_percentage, notes) VALUES (1, 3, 1.0, 0.0, 'Internal drive servo core')")
        c.execute("INSERT INTO bom_items (product_id, raw_material_id, quantity_required, scrap_percentage, notes) VALUES (2, 2, 1.8, 4.0, 'Hardened steel gripper jaws & hinge')")
        c.execute("INSERT INTO bom_items (product_id, raw_material_id, quantity_required, scrap_percentage, notes) VALUES (2, 4, 0.8, 2.0, 'Protective sensor shroud housing')")
        
        # Seed Customer Orders (in INR ₹)
        c.execute("INSERT INTO customer_orders (order_number, customer_id, order_date, delivery_date, status, total_amount, invoiced, notes) VALUES ('ORD-2026-0001', 1, '2026-10-10', '2026-10-25', 'DELIVERED', 570000.00, 1, 'Chakan plant urgent automation expansion')")
        c.execute("INSERT INTO customer_order_items (order_id, product_id, quantity, unit_price, subtotal) VALUES (1, 1, 20, 28500.00, 570000.00)")
        
        c.execute("INSERT INTO customer_orders (order_number, customer_id, order_date, delivery_date, status, total_amount, invoiced, notes) VALUES ('ORD-2026-0002', 2, '2026-10-22', '2026-11-10', 'IN_PRODUCTION', 396000.00, 1, 'Mundhwa robotics cell batch')")
        c.execute("INSERT INTO customer_order_items (order_id, product_id, quantity, unit_price, subtotal) VALUES (2, 2, 20, 19800.00, 396000.00)")
        
        c.execute("INSERT INTO customer_orders (order_number, customer_id, order_date, delivery_date, status, total_amount, invoiced, notes) VALUES ('ORD-2026-0003', 3, '2026-10-28', '2026-11-18', 'CONFIRMED', 445000.00, 0, 'Powai heavy equipment assembly')")
        c.execute("INSERT INTO customer_order_items (order_id, product_id, quantity, unit_price, subtotal) VALUES (3, 3, 10, 44500.00, 445000.00)")
        
        # Seed Manufacturing Orders
        c.execute("INSERT INTO manufacturing_orders (mo_number, customer_order_id, product_id, quantity_to_produce, status, start_date, completion_date, materials_issued, notes) VALUES ('MO-2026-0001', 1, 1, 20, 'COMPLETED', '2026-10-12', '2026-10-22', 1, 'Delivered to Chakan plant on schedule')")
        c.execute("INSERT INTO manufacturing_orders (mo_number, customer_order_id, product_id, quantity_to_produce, status, start_date, completion_date, materials_issued, notes) VALUES ('MO-2026-0002', 2, 2, 20, 'IN_PROGRESS', '2026-10-24', NULL, 1, 'Shop Floor Cell 4 running')")
        
        # Seed Purchase Orders
        c.execute("INSERT INTO purchase_orders (po_number, supplier_id, order_date, expected_delivery_date, status, total_amount, notes) VALUES ('PO-2026-0001', 1, '2026-10-05', '2026-10-12', 'RECEIVED', 142500.00, 'Aircraft grade aluminum billet supply')")
        c.execute("INSERT INTO purchase_order_items (po_id, raw_material_id, quantity, unit_price, subtotal) VALUES (1, 1, 500, 285.00, 142500.00)")
        
        # Seed Invoices (with Indian GST 18%: 9% CGST + 9% SGST)
        # Order 1: 5,70,000 + 18% GST (1,02,600) = 6,72,600 (PAID)
        c.execute("INSERT INTO invoices (invoice_number, customer_order_id, invoice_date, due_date, subtotal, tax_amount, total_amount, paid_amount, outstanding_balance, status) VALUES ('INV-2026-0001', 1, '2026-10-25', '2026-11-24', 570000.00, 102600.00, 672600.00, 672600.00, 0.00, 'PAID')")
        # Order 2: 3,96,000 + 18% GST (71,280) = 4,67,280 (PARTIALLY_PAID)
        c.execute("INSERT INTO invoices (invoice_number, customer_order_id, invoice_date, due_date, subtotal, tax_amount, total_amount, paid_amount, outstanding_balance, status) VALUES ('INV-2026-0002', 2, '2026-10-26', '2026-11-25', 396000.00, 71280.00, 467280.00, 200000.00, 267280.00, 'PARTIALLY_PAID')")
        
        # Seed Payments (Indian Payment Methods: RTGS, NEFT, UPI)
        c.execute("INSERT INTO payments (payment_number, invoice_id, amount, payment_date, payment_method, reference_number, notes) VALUES ('PAY-2026-0001', 1, 672600.00, '2026-10-28', 'NEFT_RTGS', 'RTGS/SBIN000456/778811', 'Tata Motors full contract RTGS settlement')")
        c.execute("INSERT INTO payments (payment_number, invoice_id, amount, payment_date, payment_method, reference_number, notes) VALUES ('PAY-2026-0002', 2, 200000.00, '2026-10-29', 'NEFT_RTGS', 'NEFT/HDFC0001234/987123', 'Bharat Forge advance milestone tranche')")
        
        # Seed Transaction Ledger
        c.execute("INSERT INTO inventory_transactions (raw_material_id, transaction_type, quantity, stock_before, stock_after, reference_number, notes, created_at) VALUES (1, 'PURCHASE_RECEIPT', 500.0, 32.5, 532.5, 'PO-2026-0001', 'Received consignment from Jindal Steel & Power', '2026-10-12 14:30:00')")
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

# If not logged in, display sign in or account registration
if not st.session_state.get("user"):
    st.markdown("<h2 style='text-align: center; color: #1e3a8a;'>⚙️ OrderCraft India (ऑर्डरक्राफ्ट)</h2>", unsafe_allow_html=True)
    st.markdown("<p style='text-align: center; color: #64748b; font-size: 15px;'>Manufacturing ERP, GST Invoicing & Shop Floor Execution System</p>", unsafe_allow_html=True)
    
    col1, col2, col3 = st.columns([1, 1.4, 1])
    with col2:
        tab_login, tab_register = st.tabs(["🔐 Sign In", "✨ Create New Account"])
        
        with tab_login:
            with st.form("login_form"):
                st.subheader("Account Sign In")
                u = st.text_input("Username / उपयोगकर्ता नाम", placeholder="Enter your username")
                p = st.text_input("Password / पासवर्ड", type="password", placeholder="Enter your password")
                submitted = st.form_submit_button("Sign In to OrderCraft", use_container_width=True)
                if submitted:
                    if not u.strip() or not p:
                        st.warning("Please enter both username and password.")
                    elif login(u.strip(), p):
                        st.success("Authentication successful! Loading workspace...")
                        st.rerun()
                    else:
                        st.error("Invalid username or password. Please try again or create a new account.")
                        
        with tab_register:
            with st.form("register_form"):
                st.subheader("Register New Account")
                full_name = st.text_input("Full Name (पूरा नाम)", placeholder="e.g. Ramesh Kumar")
                new_user = st.text_input("Choose Username (उपयोगकर्ता नाम)", placeholder="e.g. ramesh_k")
                new_pass = st.text_input("Password (पासवर्ड)", type="password", placeholder="Enter password")
                confirm_pass = st.text_input("Confirm Password", type="password", placeholder="Re-enter password")
                role_label = st.selectbox(
                    "Assign Role (पद)",
                    ["Plant Operations & Supervisor (Staff)", "Managing Director & Plant Head (Admin)"]
                )
                role_val = "ROLE_ADMIN" if "Admin" in role_label else "ROLE_STAFF"
                reg_submitted = st.form_submit_button("Create My Account", use_container_width=True)
                if reg_submitted:
                    if not full_name.strip() or not new_user.strip() or not new_pass:
                        st.warning("Please fill in all required fields.")
                    elif new_pass != confirm_pass:
                        st.error("Passwords do not match. Please re-enter.")
                    elif len(new_pass) < 4:
                        st.warning("Password must be at least 4 characters long.")
                    else:
                        conn = get_db()
                        existing = conn.execute("SELECT id FROM users WHERE LOWER(username) = LOWER(?)", (new_user.strip(),)).fetchone()
                        if existing:
                            conn.close()
                            st.error(f"Username '{new_user.strip()}' already exists. Please pick another username.")
                        else:
                            conn.execute(
                                "INSERT INTO users (username, password, full_name, role) VALUES (?, ?, ?, ?)",
                                (new_user.strip(), new_pass, full_name.strip(), role_val)
                            )
                            conn.commit()
                            user_rec = conn.execute("SELECT * FROM users WHERE username = ?", (new_user.strip(),)).fetchone()
                            conn.close()
                            st.session_state["user"] = dict(user_rec)
                            st.success(f"Welcome, {full_name.strip()}! Your account has been registered.")
                            st.rerun()
    st.stop()

# ==============================================================================
# 4. SIDEBAR NAVIGATION & USER INFO
# ==============================================================================
user = st.session_state.get("user") or {"full_name": "Guest", "role": "ROLE_GUEST"}
with st.sidebar:
    st.markdown("## ⚙️ **OrderCraft India**")
    st.caption("Industrial ERP & GST Compliance")
    st.divider()
    
    st.markdown(f"👤 **{user['full_name']}**")
    st.caption(f"Access Role: `{user['role']}`")
    
    menu = st.radio(
        "ERP Modules (मॉड्यूल):",
        [
            "📊 Executive Dashboard",
            "🛒 Customer Sales Orders",
            "👥 Customer Accounts",
            "⚙️ Production Orders (MO)",
            "📦 Products & BOM Recipe",
            "🧱 Raw Materials & Inventory",
            "🚚 Procurement & POs",
            "🏭 Supplier Directory",
            "📑 Invoices & Receivables (GST)",
            "💳 Payments & Settlements",
            "📈 Reports & CSV Exports"
        ]
    )
    
    st.divider()
    if st.button("Sign Out / लॉग आउट", use_container_width=True):
        logout()
        st.rerun()

# ==============================================================================
# 5. MODULE: EXECUTIVE DASHBOARD
# ==============================================================================
if menu == "📊 Executive Dashboard":
    st.title("Operational & Financial Overview")
    st.caption("Live factory metrics, production progress, and cash flow intelligence (INR ₹)")
    
    conn = get_db()
    # Metrics
    total_orders = conn.execute("SELECT COUNT(*) FROM customer_orders").fetchone()[0]
    in_prod_orders = conn.execute("SELECT COUNT(*) FROM customer_orders WHERE status = 'IN_PRODUCTION'").fetchone()[0]
    total_invoiced = conn.execute("SELECT COALESCE(SUM(total_amount), 0) FROM invoices").fetchone()[0]
    total_collected = conn.execute("SELECT COALESCE(SUM(paid_amount), 0) FROM invoices").fetchone()[0]
    outstanding = conn.execute("SELECT COALESCE(SUM(outstanding_balance), 0) FROM invoices").fetchone()[0]
    low_stock = conn.execute("SELECT COUNT(*) FROM raw_materials WHERE current_stock <= reorder_level").fetchone()[0]
    
    k1, k2, k3, k4 = st.columns(4)
    k1.metric("Total Sales Orders", total_orders, f"{in_prod_orders} in shop floor production")
    k2.metric("Total Invoiced Revenue", f"₹{total_invoiced:,.2f}", f"₹{total_collected:,.2f} collected")
    k3.metric("Outstanding Receivables", f"₹{outstanding:,.2f}", "Pending from customers")
    k4.metric("Low Stock Alerts", low_stock, "Items below reorder point" if low_stock > 0 else "All optimal", delta_color="inverse")
    
    st.divider()
    
    # Charts Row
    c1, c2 = st.columns([1.5, 1])
    with c1:
        st.subheader("Monthly Revenue Trend (₹)")
        rev_data = pd.DataFrame({
            "Month": ["May 2026", "Jun 2026", "Jul 2026", "Aug 2026", "Sep 2026", "Oct 2026"],
            "Revenue": [0, 0, 0, 0, 0, total_invoiced]
        })
        fig_rev = px.bar(rev_data, x="Month", y="Revenue", title="Invoiced Volume (₹ INR)", color_discrete_sequence=["#2563eb"])
        fig_rev.update_traces(texttemplate='₹%{y:,.0f}', textposition='outside')
        fig_rev.update_layout(height=320, margin=dict(l=20, r=20, t=30, b=20))
        st.plotly_chart(fig_rev, use_container_width=True)
        
    with c2:
        st.subheader("Sales Order Workflow Distribution")
        status_df = pd.read_sql_query("SELECT status, COUNT(*) as count FROM customer_orders GROUP BY status", conn)
        fig_pie = px.pie(status_df, values="count", names="status", hole=0.5, title="Active Order Stages",
                         color_discrete_sequence=["#f59e0b", "#3b82f6", "#10b981", "#64748b", "#ef4444"])
        fig_pie.update_layout(height=320, margin=dict(l=20, r=20, t=30, b=20))
        st.plotly_chart(fig_pie, use_container_width=True)
        
    # Recent Orders & Low Stock Tables
    t1, t2 = st.columns([1.5, 1])
    with t1:
        st.subheader("Recent Customer Orders (हाल के ऑर्डर)")
        orders_df = pd.read_sql_query("""
        SELECT co.order_number as 'Order #', c.name as 'Customer', co.order_date as 'Date', co.status as 'Status', '₹' || printf('%.2f', co.total_amount) as 'Amount'
        FROM customer_orders co
        JOIN customers c ON co.customer_id = c.id
        ORDER BY co.id DESC LIMIT 5
        """, conn)
        st.dataframe(orders_df, use_container_width=True, hide_index=True)
        
    with t2:
        st.subheader("Critical Stock Warnings (कच्चा माल चेतावनी)")
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
    st.caption("Manage customer multi-line order dispatch, line pricing, and status workflows (INR ₹)")
    
    conn = get_db()
    
    with st.expander("+ Create New Customer Sales Order (नया बिक्री आदेश)", expanded=False):
        with st.form("new_order_form"):
            customers = conn.execute("SELECT id, name, customer_code FROM customers WHERE active = 1").fetchall()
            products = conn.execute("SELECT id, name, unit_price FROM products WHERE active = 1").fetchall()
            
            c_col1, c_col2 = st.columns(2)
            c_select = c_col1.selectbox("Customer Enterprise", options=[c["id"] for c in customers], format_func=lambda x: next(c["name"] for c in customers if c["id"] == x))
            order_date = c_col2.date_input("Order Date", value=date.today())
            delivery_date = c_col2.date_input("Target Dispatch Date", value=date.today() + timedelta(days=14))
            notes = c_col1.text_input("Commercial Notes", placeholder="e.g. Pune MIDC assembly batch")
            
            st.markdown("##### Order Product Lines")
            p_select = st.selectbox("Product Line", options=[p["id"] for p in products], format_func=lambda x: next(f"{p['name']} (₹{p['unit_price']:,.2f})" for p in products if p["id"] == x))
            p_qty = st.number_input("Order Quantity (Units)", min_value=1, value=10)
            
            submit_order = st.form_submit_button("Book Sales Order (आदेश बुक करें)", use_container_width=True)
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
                st.success(f"Sales Order **{ord_num}** successfully booked for ₹{total:,.2f}!")
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
                st.markdown(f"📅 Booked: `{o['order_date']}` | Target Dispatch: `{o['delivery_date'] or 'N/A'}` | Value: **₹{o['total_amount']:,.2f}**")
                st.markdown(f"Status: `{o['status']}` | Invoiced: `{'YES (चालान जारी)' if o['invoiced'] else 'NO'}`")
            
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
                    if act_cols[0].button("Dispatch / Deliver", key=f"del_{o['id']}"):
                        conn.execute("UPDATE customer_orders SET status = 'DELIVERED' WHERE id = ?", (o['id'],))
                        conn.commit()
                        st.rerun()
                        
                if not o['invoiced'] and o['status'] in ['IN_PRODUCTION', 'COMPLETED', 'DELIVERED']:
                    if act_cols[1].button("Generate GST Invoice", key=f"inv_{o['id']}"):
                        inv_num = f"INV-2026-{datetime.now().strftime('%M%S')}"
                        subtot = o['total_amount']
                        tax = round(subtot * 0.18, 2)  # Standard 18% GST (9% CGST + 9% SGST)
                        grand_tot = subtot + tax
                        due_date = str(date.today() + timedelta(days=30))
                        conn.execute("INSERT INTO invoices (invoice_number, customer_order_id, invoice_date, due_date, subtotal, tax_amount, total_amount, paid_amount, outstanding_balance, status) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, 'ISSUED')",
                                     (inv_num, o['id'], str(date.today()), due_date, subtot, tax, grand_tot, grand_tot))
                        conn.execute("UPDATE customer_orders SET invoiced = 1 WHERE id = ?", (o['id'],))
                        conn.commit()
                        st.success(f"Generated GST Tax Invoice **{inv_num}**!")
                        st.rerun()
    conn.close()

# ==============================================================================
# 7. MODULE: MANUFACTURING ORDERS & BOM EXECUTION
# ==============================================================================
elif menu == "⚙️ Production Orders (MO)":
    st.title("Manufacturing & Shop Floor Execution (उत्पादन आदेश)")
    st.caption("Schedule shop floor batches, auto-issue raw materials according to BOM recipes, and check warehouse shortages")
    
    conn = get_db()
    with st.expander("+ Schedule New Production Job (नया उत्पादन कार्य)", expanded=False):
        with st.form("new_mo_form"):
            orders = conn.execute("SELECT id, order_number FROM customer_orders").fetchall()
            products = conn.execute("SELECT id, name, product_code FROM products WHERE active = 1").fetchall()
            
            m1, m2 = st.columns(2)
            ord_sel = m1.selectbox("Sales Order Reference", options=[o["id"] for o in orders], format_func=lambda x: next(o["order_number"] for o in orders if o["id"] == x))
            prod_sel = m2.selectbox("Product to Make", options=[p["id"] for p in products], format_func=lambda x: next(f"{p['name']} ({p['product_code']})" for p in products if p["id"] == x))
            qty = m1.number_input("Batch Quantity to Produce (इकाई)", min_value=1, value=10)
            instructions = m2.text_input("Floor Notes", placeholder="e.g. Workstation Line 2, Shift A")
            
            if st.form_submit_button("Schedule Job (कार्य अनुसूची)", use_container_width=True):
                mo_num = f"MO-2026-{datetime.now().strftime('%M%S')}"
                conn.execute("INSERT INTO manufacturing_orders (mo_number, customer_order_id, product_id, quantity_to_produce, status, notes) VALUES (?, ?, ?, ?, 'PLANNED', ?)",
                             (mo_num, ord_sel, prod_sel, qty, instructions))
                conn.commit()
                st.success(f"Production Job **{mo_num}** scheduled successfully!")
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
                st.markdown(f"Status: `{mo['status']}` | BOM Stock Deducted: `{'YES (स्टॉक जारी)' if mo['materials_issued'] else 'PENDING'}`")
            
            with i2:
                # Shortage check
                if st.button("Check Stock Shortages (कमी जांचें)", key=f"chk_{mo['id']}"):
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
                    if st.button("Complete Job (कार्य पूर्ण)", key=f"fin_{mo['id']}", type="primary"):
                        conn.execute("UPDATE manufacturing_orders SET status = 'COMPLETED', completion_date = ? WHERE id = ?", (str(date.today()), mo['id']))
                        conn.commit()
                        st.success(f"Production Job {mo['mo_number']} marked COMPLETED!")
                        st.rerun()
    conn.close()

# ==============================================================================
# 8. MODULE: PRODUCTS & BILL OF MATERIALS (BOM)
# ==============================================================================
elif menu == "📦 Products & BOM Recipe":
    st.title("Manufactured Products & Bill of Materials (BOM)")
    st.caption("Engineered products catalogue, multi-level components, scrap allowances, and requirement simulations")
    
    conn = get_db()
    with st.expander("+ Add Manufactured Product (नया उत्पाद जोड़ें)", expanded=False):
        with st.form("new_prod_form"):
            p1, p2 = st.columns(2)
            code = p1.text_input("Product Code", placeholder="e.g. PRD-MOT-500")
            name = p2.text_input("Product Name", placeholder="e.g. Industrial BLDC Drive Motor")
            desc = p1.text_area("Engineering Description")
            price = p2.number_input("Selling Price (₹ INR)", min_value=0.0, value=25000.0, step=500.0)
            uom = p2.text_input("Unit of Measure", value="UNIT")
            if st.form_submit_button("Save Product to Master Catalogue"):
                conn.execute("INSERT INTO products (product_code, name, description, unit_price, unit_of_measure) VALUES (?, ?, ?, ?, ?)",
                             (code, name, desc, price, uom))
                conn.commit()
                st.success("Product registered in master catalogue!")
                st.rerun()

    prods = conn.execute("SELECT * FROM products").fetchall()
    for p in prods:
        with st.container(border=True):
            st.markdown(f"### **{p['name']}** (`{p['product_code']}`)")
            st.markdown(f"Description: *{p['description']}* | Selling Price: **₹{p['unit_price']:,.2f}** | UoM: `{p['unit_of_measure']}`")
            
            # BOM Items
            boms = conn.execute("""
            SELECT bi.id, rm.material_code, rm.name as material_name, bi.quantity_required, rm.unit_of_measure, bi.scrap_percentage, bi.notes
            FROM bom_items bi
            JOIN raw_materials rm ON bi.raw_material_id = rm.id
            WHERE bi.product_id = ?
            """, (p['id'],)).fetchall()
            
            if boms:
                st.write("**BOM Recipe Components (कच्चे माल की सामग्री):**")
                b_df = pd.DataFrame([dict(b) for b in boms])
                st.dataframe(b_df[["material_code", "material_name", "quantity_required", "unit_of_measure", "scrap_percentage", "notes"]], hide_index=True, use_container_width=True)
            else:
                st.info("No raw material components linked to this product recipe yet.")
                
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
                        st.success("Component linked to BOM recipe!")
                        st.rerun()
    conn.close()

# ==============================================================================
# 9. MODULE: RAW MATERIALS & INVENTORY
# ==============================================================================
elif menu == "🧱 Raw Materials & Inventory":
    st.title("Raw Materials & Stock Movement Ledger (कच्चा माल भंडार)")
    st.caption("Warehouse stock balances, reorder safety thresholds, and audit logging (INR ₹)")
    
    conn = get_db()
    with st.expander("+ Register Raw Material in Inventory (नया कच्चा माल पंजीकृत करें)", expanded=False):
        with st.form("new_rm_form"):
            r1, r2 = st.columns(2)
            code = r1.text_input("Material Code", placeholder="e.g. RM-COP-05")
            name = r2.text_input("Material Name", placeholder="e.g. ETP Grade Pure Copper Wire")
            desc = r1.text_area("Technical Description")
            cost = r2.number_input("Standard Unit Cost (₹ INR)", min_value=0.01, value=450.00)
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
    SELECT id, material_code as 'Code', name as 'Material', description as 'Description', '₹' || printf('%.2f', unit_cost) as 'Cost / Unit',
           current_stock || ' ' || unit_of_measure as 'In Stock', reorder_level || ' ' || unit_of_measure as 'Reorder Level',
           CASE WHEN current_stock <= reorder_level THEN '⚠️ LOW STOCK' ELSE '✅ HEALTHY' END as 'Status'
    FROM raw_materials
    """, conn)
    st.dataframe(rms_df, use_container_width=True, hide_index=True)
    
    # Stock Adjustment Form
    st.subheader("Physical Count Reconciliation / Adjustment (स्टॉक समायोजन)")
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
    st.subheader("Recent Inventory Transaction Audit Log (स्टॉक रजिस्टर)")
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
    st.title("Procurement & Vendor Purchase Orders (खरीद आदेश)")
    st.caption("Manage supplier purchase contracts and replenish warehouse inventory via inbound goods receiving (INR ₹)")
    
    conn = get_db()
    with st.expander("+ Create Vendor Purchase Order (नया खरीद आदेश)", expanded=False):
        with st.form("new_po_form"):
            suppliers = conn.execute("SELECT id, name, supplier_code FROM suppliers WHERE active = 1").fetchall()
            rms = conn.execute("SELECT id, name, unit_cost, unit_of_measure FROM raw_materials WHERE active = 1").fetchall()
            
            p1, p2 = st.columns(2)
            supp_sel = p1.selectbox("Vendor / Supplier", options=[s["id"] for s in suppliers], format_func=lambda x: next(f"{s['name']} ({s['supplier_code']})" for s in suppliers if s["id"] == x))
            order_date = p2.date_input("PO Date", value=date.today())
            delivery_date = p2.date_input("Expected Delivery Date", value=date.today() + timedelta(days=7))
            notes = p1.text_input("Purchase Notes", placeholder="e.g. Monthly raw material restock")
            
            rm_sel = st.selectbox("Raw Material Line", options=[r["id"] for r in rms], format_func=lambda x: next(f"{r['name']} (₹{r['unit_cost']:,.2f}/{r['unit_of_measure']})" for r in rms if r["id"] == x))
            qty = st.number_input("Order Quantity", min_value=1.0, value=100.0)
            
            if st.form_submit_button("Draft Purchase Order (आदेश तैयार करें)"):
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
                st.success(f"Purchase Order **{po_num}** drafted for ₹{tot:,.2f}!")
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
                st.markdown(f"Material: **{po['quantity']} units** of `{po['material_name']}` | Total: **₹{po['total_amount']:,.2f}**")
                st.markdown(f"Order Date: `{po['order_date']}` | Status: `{po['status']}`")
            with col_act:
                if po['status'] == 'DRAFT':
                    if st.button("Submit to Vendor (विक्रेता को भेजें)", key=f"sub_po_{po['id']}"):
                        conn.execute("UPDATE purchase_orders SET status = 'SUBMITTED' WHERE id = ?", (po['id'],))
                        conn.commit()
                        st.success(f"PO {po['po_number']} submitted to vendor!")
                        st.rerun()
                elif po['status'] == 'SUBMITTED':
                    if st.button("Receive Inbound Goods (सामान प्राप्त करें)", key=f"rec_po_{po['id']}", type="primary"):
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
    st.title("Customer Accounts Directory (ग्राहक विवरण)")
    st.caption("Manage Indian OEM accounts, contact executives, factory delivery sites, and GSTIN compliance")
    conn = get_db()
    with st.expander("+ Register New Customer Account (नया ग्राहक जोड़ें)", expanded=False):
        with st.form("new_cust"):
            c1, c2 = st.columns(2)
            code = c1.text_input("Customer Code", placeholder="e.g. CUST-1005")
            name = c2.text_input("Company / Business Name", placeholder="e.g. Ashok Leyland Defense Systems")
            email = c1.text_input("Commercial Email", placeholder="procurement@ashokleyland.com")
            phone = c2.text_input("Phone Number", placeholder="+91 98400 12345")
            addr = c1.text_area("Factory / Works Address", placeholder="e.g. Ennore High Road, Chennai, Tamil Nadu 600057")
            tax = c2.text_input("GSTIN / PAN Number", placeholder="e.g. 33AAACA1234F1Z1")
            if st.form_submit_button("Register Customer Account"):
                conn.execute("INSERT INTO customers (customer_code, name, email, phone, address, tax_id) VALUES (?, ?, ?, ?, ?, ?)",
                             (code, name, email, phone, addr, tax))
                conn.commit()
                st.success("Customer account registered!")
                st.rerun()
    cust_df = pd.read_sql_query("SELECT customer_code as 'Code', name as 'Customer Name', email as 'Email', phone as 'Phone', address as 'Factory / Site Address', tax_id as 'GSTIN / PAN' FROM customers", conn)
    st.dataframe(cust_df, use_container_width=True, hide_index=True)
    conn.close()

elif menu == "🏭 Supplier Directory":
    st.title("Vendor & Supplier Directory (आपूर्तिकर्ता सूची)")
    st.caption("Directory of raw material manufacturers, metal foundries, electrical component distributors, and credit terms")
    conn = get_db()
    with st.expander("+ Register New Supplier (नया आपूर्तिकर्ता जोड़ें)", expanded=False):
        with st.form("new_supp"):
            s1, s2 = st.columns(2)
            code = s1.text_input("Supplier Code", placeholder="e.g. SUP-505")
            name = s2.text_input("Company / Mill Name", placeholder="e.g. Vedanta Aluminium Ltd")
            contact = s1.text_input("Contact Person", placeholder="e.g. Amit Singhania")
            email = s2.text_input("Commercial Email", placeholder="sales@vedanta.in")
            phone = s1.text_input("Phone Number", placeholder="+91 97770 12345")
            terms = s2.text_input("Payment Terms", value="Net 30 Days (RTGS)")
            lead = s1.number_input("Lead Time (Days)", min_value=1, value=7)
            addr = s2.text_area("Plant / Dispatch Address", placeholder="e.g. Jharsuguda Industrial Corridor, Odisha 768201")
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
# 12. MODULE: INVOICES & PAYMENTS (INDIAN GST & UPI / RTGS / NEFT)
# ==============================================================================
elif menu == "📑 Invoices & Receivables (GST)":
    st.title("GST Invoices & Accounts Receivable (जीएसटी चालान)")
    st.caption("Generate GST-compliant tax invoices (18% GST), monitor receivables, and track settlements (INR ₹)")
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
                st.markdown(f"Ref Order: `{inv['order_number']}` | Date: `{inv['invoice_date']}` | Due Date: `{inv['due_date']}`")
                st.markdown(f"Taxable Subtotal: **₹{inv['subtotal']:,.2f}** | GST (18%): **₹{inv['tax_amount']:,.2f}** | Invoice Total: **₹{inv['total_amount']:,.2f}**")
                st.markdown(f"Paid Amount: <span style='color:green;'>**₹{inv['paid_amount']:,.2f}**</span> | Outstanding: <span style='color:red;'>**₹{inv['outstanding_balance']:,.2f}**</span>", unsafe_allow_html=True)
            with col_p:
                if inv['outstanding_balance'] > 0:
                    st.write("**Instant Settlement (त्वरित भुगतान):**")
                    if st.button("Settle Full Balance (RTGS/UPI)", key=f"pay_full_{inv['id']}", type="primary"):
                        bal = inv['outstanding_balance']
                        pay_num = f"PAY-2026-{datetime.now().strftime('%M%S')}"
                        conn.execute("INSERT INTO payments (payment_number, invoice_id, amount, payment_date, payment_method, reference_number, notes) VALUES (?, ?, ?, ?, 'NEFT_RTGS', ?, 'Full settlement recorded via RTGS')",
                                     (pay_num, inv['id'], bal, str(date.today()), f"RTGS/SETTLE/{datetime.now().strftime('%M%S')}"))
                        conn.execute("UPDATE invoices SET paid_amount = paid_amount + ?, outstanding_balance = 0.0, status = 'PAID' WHERE id = ?", (bal, inv['id']))
                        conn.commit()
                        st.success(f"Settled invoice {inv['invoice_number']} for ₹{bal:,.2f}!")
                        st.rerun()
    conn.close()

elif menu == "💳 Payments & Settlements":
    st.title("Cash Receipts & Payments Ledger (भुगतान रजिस्टर)")
    st.caption("Record customer inbound settlements across UPI, NEFT, RTGS, IMPS, and Cheque (INR ₹)")
    conn = get_db()
    with st.expander("+ Record Inbound Payment (भुगतान दर्ज करें)", expanded=False):
        with st.form("new_pay"):
            open_invs = conn.execute("SELECT id, invoice_number, outstanding_balance FROM invoices WHERE outstanding_balance > 0").fetchall()
            if open_invs:
                inv_sel = st.selectbox("Select Pending GST Invoice", options=[i["id"] for i in open_invs], format_func=lambda x: next(f"{i['invoice_number']} (Balance: ₹{i['outstanding_balance']:,.2f})" for i in open_invs if i["id"] == x))
                chosen_inv = next(i for i in open_invs if i["id"] == inv_sel)
                amt = st.number_input("Payment Amount (₹ INR)", min_value=1.0, max_value=float(chosen_inv["outstanding_balance"]), value=float(chosen_inv["outstanding_balance"]))
                mthd = st.selectbox("Payment Mode (भुगतान विधि)", ["NEFT_RTGS (Net Banking)", "UPI (Google Pay / PhonePe / BHIM)", "IMPS", "Account Payee Cheque", "Cash"])
                ref = st.text_input("UTR / Transaction Reference #", placeholder="e.g. UTR/SBIN000456789 or UPI/HDFC/981240182")
                if st.form_submit_button("Post Payment (भुगतान जमा करें)"):
                    p_num = f"PAY-2026-{datetime.now().strftime('%M%S')}"
                    conn.execute("INSERT INTO payments (payment_number, invoice_id, amount, payment_date, payment_method, reference_number) VALUES (?, ?, ?, ?, ?, ?)",
                                 (p_num, inv_sel, amt, str(date.today()), mthd, ref))
                    new_bal = chosen_inv["outstanding_balance"] - amt
                    status = "PAID" if new_bal == 0 else "PARTIALLY_PAID"
                    conn.execute("UPDATE invoices SET paid_amount = paid_amount + ?, outstanding_balance = ?, status = ? WHERE id = ?",
                                 (amt, new_bal, status, inv_sel))
                    conn.commit()
                    st.success(f"Payment {p_num} for ₹{amt:,.2f} posted against {chosen_inv['invoice_number']}!")
                    st.rerun()
            else:
                st.info("No open unpaid invoices found.")
                st.form_submit_button("Done", disabled=True)
                
    pays_df = pd.read_sql_query("""
    SELECT p.payment_number as 'Receipt #', i.invoice_number as 'Invoice #', p.payment_date as 'Date', p.payment_method as 'Payment Mode',
           '₹' || printf('%.2f', p.amount) as 'Amount Received', p.reference_number as 'UTR / Reference'
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
    st.title("Operational Reports & CSV Data Exports (रिपोर्ट और डेटा निर्यात)")
    st.caption("Generate downloadable spreadsheets for statutory audits, GST reconciliation, and inventory tracking")
    
    conn = get_db()
    r1, r2 = st.columns(2)
    
    with r1:
        st.subheader("Sales Orders Ledger")
        df_ord = pd.read_sql_query("SELECT * FROM customer_orders", conn)
        st.download_button("Download Orders CSV (बिक्री रिपोर्ट)", df_ord.to_csv(index=False), "customer_orders_india_export.csv", "text/csv", use_container_width=True)
        
        st.subheader("GST Invoices & Billing Ledger")
        df_inv = pd.read_sql_query("SELECT * FROM invoices", conn)
        st.download_button("Download Invoices CSV (जीएसटी चालान रिपोर्ट)", df_inv.to_csv(index=False), "gst_invoices_india_export.csv", "text/csv", use_container_width=True)
        
    with r2:
        st.subheader("Warehouse Inventory Report")
        df_rm = pd.read_sql_query("SELECT * FROM raw_materials", conn)
        st.download_button("Download Inventory CSV (भंडार रिपोर्ट)", df_rm.to_csv(index=False), "warehouse_inventory_india_export.csv", "text/csv", use_container_width=True)
        
        st.subheader("Payment Transactions Ledger")
        df_pay = pd.read_sql_query("SELECT * FROM payments", conn)
        st.download_button("Download Payments CSV (भुगतान रिपोर्ट)", df_pay.to_csv(index=False), "cash_payments_india_export.csv", "text/csv", use_container_width=True)
    conn.close()
