# OrderCraft — Manufacturing Order Management System (Enterprise ERP)

OrderCraft is an enterprise-grade Manufacturing Order Management and ERP Web Application designed to manage the end-to-end order-to-cash and procure-to-pay lifecycles.

---

## 1. Unified Architecture & High-Performance Production Build

The application has been unified into a single high-performance production distribution:
- **Embedded Frontend**: The Angular 22 client is compiled with AOT (Ahead-of-Time), tree-shaking, and minification, then served directly by the Spring Boot server from `src/main/resources/static/`.
- **GZIP Compression**: Configured at the server level for all HTML, JSON, CSS, and JS assets (reducing payload sizes by over 75%).
- **HikariCP Connection Pool**: Tuned for high concurrency (`maximum-pool-size=20`, `connection-timeout=20000ms`).
- **JPA Optimization**: `spring.jpa.open-in-view=false` and batch query execution configured.
- **Single Port Simplicity**: Everything runs on port **8081** without needing `ng serve` or dev-server proxies.

---

## 2. Accessing OrderCraft Without "localhost"

You do not need to use `localhost`. You have multiple ways to access OrderCraft:

### Option A: Local Network IP (Wi-Fi / LAN)
Access the application from your laptop, mobile phone, tablet, or another machine on the same network:
```
http://192.168.1.70:8081/
```
*(Bound to `0.0.0.0:8081` so any device on your Wi-Fi can connect directly)*

### Option B: Custom Domain via Local DNS / Hosts File
You can map a custom name (e.g. `ordercraft.app` or `ordercraft.local`) so you can type a clean enterprise domain in your browser:
1. Open PowerShell as Administrator and run:
   ```powershell
   Add-Content -Path C:\Windows\System32\drivers\etc\hosts -Value "127.0.0.1 ordercraft.local"
   ```
2. Open your browser and navigate to:
   ```
   http://ordercraft.local:8081/
   ```

### Option C: Cloud Deployment via Docker
Deploy with 1 command to any VPS or cloud provider (Render, Railway, AWS EC2, DigitalOcean):
```bash
docker-compose up -d --build
```

---

## 3. UI & Performance Features

1. **Floating Toast Notifications**:
   - Replaced browser `alert()` and `confirm()` with non-blocking, auto-dismissing animated toast notifications (Success, Error, Warning, Info).
2. **Tabbed Workflow Status Filters**:
   - Filter tabs on Customer Orders (`All`, `Pending`, `Confirmed`, `In Production`, `Completed`, `Delivered`).
   - Filter tabs on Production Jobs (`All`, `Planned`, `In Progress`, `Completed`).
   - Filter tabs on Purchase Orders (`All`, `Draft`, `Submitted`, `Received`).
   - Filter tabs on Invoices (`All`, `Issued`, `Partially Paid`, `Settled`).
   - Real-time badge counters on every tab.
3. **Quick Action Acceleration**:
   - **Quick Settle**: 1-click invoice settlement directly from the invoice table row.
   - **Quick Restock Alert**: Instant filter for raw materials needing replenishment.
   - **Inbound Goods Check-in**: Streamlined receipt dialog that auto-updates stock balances and logs movement transactions.
4. **Interactive Dashboard**:
   - Live revenue trends (Chart.js Bar Chart).
   - Order workflow status distribution (Chart.js Doughnut Chart).
   - Real-time inventory shortage alerts and recent order tracking.
5. **Full CSV Data Export**:
   - Instant downloadable CSV reports for Orders, Invoices, Warehouse Inventory, and Cash Receipts.

---

## 4. Demo Login Credentials

- **Administrator**: `admin` / `admin123`
- **Staff Member**: `staff` / `staff123`
