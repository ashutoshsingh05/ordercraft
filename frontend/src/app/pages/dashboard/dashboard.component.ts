import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { DashboardStats } from '../../models/models';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div>
      <div class="toolbar">
        <div>
          <h2>Operational Overview</h2>
          <p style="color: #64748b; font-size: 13.5px;">Live metrics and production order statistics</p>
        </div>
      </div>

      <!-- KPI Grid -->
      <div class="grid-kpi">
        <div class="kpi-card kpi-primary">
          <div class="kpi-label">Total Customer Orders</div>
          <div class="kpi-value">{{ stats?.totalOrders || 0 }}</div>
          <div class="kpi-subtext">{{ stats?.inProductionOrders || 0 }} in active production</div>
        </div>

        <div class="kpi-card kpi-success">
          <div class="kpi-label">Revenue Invoiced</div>
          <div class="kpi-value">₹{{ (stats?.totalInvoicedAmount || 0) | number:'1.2-2' }}</div>
          <div class="kpi-subtext">₹{{ (stats?.totalRevenueCollected || 0) | number:'1.2-2' }} collected</div>
        </div>

        <div class="kpi-card kpi-warning">
          <div class="kpi-label">Outstanding Receivables</div>
          <div class="kpi-value">₹{{ (stats?.outstandingPayments || 0) | number:'1.2-2' }}</div>
          <div class="kpi-subtext">Unpaid customer invoices</div>
        </div>

        <div class="kpi-card kpi-danger">
          <div class="kpi-label">Low Stock Materials</div>
          <div class="kpi-value">{{ stats?.lowStockCount || 0 }}</div>
          <div class="kpi-subtext">Items below reorder threshold</div>
        </div>
      </div>

      <!-- Charts Section -->
      <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 24px; margin-bottom: 24px;">
        <div class="card">
          <div class="card-header">
            <h3>Monthly Revenue Trend</h3>
          </div>
          <div style="height: 260px;">
            <canvas #revenueChart></canvas>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3>Order Status Distribution</h3>
          </div>
          <div style="height: 260px;">
            <canvas #statusChart></canvas>
          </div>
        </div>
      </div>

      <!-- Recent Orders & Low Stock Alerts -->
      <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 24px;">
        <div class="card">
          <div class="card-header">
            <h3>Recent Customer Orders</h3>
            <a routerLink="/orders" class="btn btn-secondary btn-sm">View All Orders</a>
          </div>
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Order Date</th>
                  <th>Status</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                @for (order of stats?.recentOrders; track order.id) {
                  <tr>
                    <td><strong>{{ order.orderNumber }}</strong></td>
                    <td>{{ order.customer?.name }}</td>
                    <td>{{ order.orderDate }}</td>
                    <td>
                      <span class="badge" [ngClass]="{
                        'badge-warning': order.status === 'CONFIRMED' || order.status === 'PENDING',
                        'badge-info': order.status === 'IN_PRODUCTION',
                        'badge-success': order.status === 'COMPLETED' || order.status === 'DELIVERED',
                        'badge-danger': order.status === 'CANCELLED'
                      }">{{ order.status }}</span>
                    </td>
                    <td>₹{{ (order.totalAmount || 0) | number:'1.2-2' }}</td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="5" style="text-align: center; color: #94a3b8; padding: 24px;">No recent orders found</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3>Critical Stock Alerts</h3>
            <a routerLink="/raw-materials" class="btn btn-secondary btn-sm">Inventory</a>
          </div>
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Material</th>
                  <th>Current</th>
                  <th>Reorder</th>
                </tr>
              </thead>
              <tbody>
                @for (item of stats?.lowStockMaterials; track item.id) {
                  <tr>
                    <td>
                      <div><strong>{{ item.name }}</strong></div>
                      <small style="color: #64748b;">{{ item.materialCode }}</small>
                    </td>
                    <td style="color: #ef4444; font-weight: 700;">{{ item.currentStock }} {{ item.unitOfMeasure }}</td>
                    <td>{{ item.reorderLevel }} {{ item.unitOfMeasure }}</td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="3" style="text-align: center; color: #10b981; padding: 24px;">All stock levels optimal!</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  @ViewChild('revenueChart') revenueCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('statusChart') statusCanvas!: ElementRef<HTMLCanvasElement>;

  stats: DashboardStats | null = null;
  private revChartInstance: any;
  private statusChartInstance: any;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.getDashboardStats().subscribe({
      next: (data) => {
        this.stats = data;
        setTimeout(() => this.renderCharts(), 50);
      },
      error: (err) => console.error('Failed to load dashboard statistics', err)
    });
  }

  renderCharts(): void {
    if (!this.stats) return;

    // Destroy existing
    if (this.revChartInstance) this.revChartInstance.destroy();
    if (this.statusChartInstance) this.statusChartInstance.destroy();

    // Monthly Sales Chart
    if (this.revenueCanvas && this.stats.monthlySales) {
      const labels = this.stats.monthlySales.map(s => s.month);
      const data = this.stats.monthlySales.map(s => s.revenue);

      this.revChartInstance = new Chart(this.revenueCanvas.nativeElement, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Monthly Invoiced ($)',
            data,
            backgroundColor: '#3b82f6',
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: { beginAtZero: true }
          }
        }
      });
    }

    // Status Distribution Chart
    if (this.statusCanvas && this.stats.orderStatusDistribution) {
      const dist = this.stats.orderStatusDistribution;
      const labels = Object.keys(dist);
      const data = Object.values(dist);

      this.statusChartInstance = new Chart(this.statusCanvas.nativeElement, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [{
            data,
            backgroundColor: ['#f59e0b', '#3b82f6', '#10b981', '#64748b', '#ef4444', '#8b5cf6']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom' }
          }
        }
      });
    }
  }
}
