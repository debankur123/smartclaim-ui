import { Component, effect, inject, OnInit } from '@angular/core';
import { Claims } from '../../../core/services/claims';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ClaimStore } from '../../../core/store/claim.store';

Chart.register(...registerables);
@Component({
  selector: 'app-reports',
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './reports.html',
  styleUrl: './reports.css',
})
export class Reports implements OnInit {
  ngOnInit(): void {
    this.claimStore.LoadClaims();
    this.claimStore.LoadReportData();
  }
  private claimService = inject(Claims);
  public claimStore = inject(ClaimStore);
  isLoading = true;

  //Summary
  summary = { total: 0, totalAmount: 0, highRisk: 0 };

  //Charts
  public statusChartType: ChartType = 'pie';
  public statusChartData: ChartConfiguration['data'] = { labels: [], datasets: [{ data: [] }] };

  public monthlyChartType: ChartType = 'bar';
  public monthlyChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [{ data: [], label: 'Claims' }],
  };

  public riskChartType: ChartType = 'doughnut';
  public riskChartData: ChartConfiguration['data'] = {
    labels: ['Low <30%', 'Medium 30-59%', 'High >=60%'],
    datasets: [{ data: [] }],
  };

  public typeChartType: ChartType = 'pie';
  public typeChartData: ChartConfiguration['data'] = { labels: [], datasets: [{ data: [] }] };

  public chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { usePointStyle: true, padding: 20, font: { size: 11 } },
      },
    },
  };

  constructor() {
    //  When signal changes, build charts automatically
    effect(() => {
      const report = this.claimStore.report();
      if (report) {
        console.log('Signal report changed:', report);
        this.BuildCharts(report);
      }
    });

    // Also watch claims for totalAmount
    effect(() => {
      const claims = this.claimStore.claims();
      console.log('Claims count:', claims.length);
    });
  }

  LoadReportData() {
    this.claimService.GetReportData().subscribe({
      next: (out: any) => {
        this.BuildCharts(out);
        console.log('report data : ', out);
        this.isLoading = false;
      },
      error: (err: any) => {
        console.log('Error while loading report :', err);
        this.isLoading = false;
      },
    });
  }

  BuildCharts(res: any) {
    console.log('API response:', res);

    // 1. Status = [{status, count}]
    const status = res.statusWise || [];
    this.statusChartData = {
      labels: status.map((s: any) => s.status || s.Status),
      datasets: [
        {
          data: status.map((s: any) => s.count ?? s.Count ?? 0),
          backgroundColor: ['#22c55e', '#f59e0b', '#3b82f6', '#ef4444', '#64748b'],
        },
      ],
    };

    // 2. Monthly  = [{month, count, totalClaimedAmount}]
    const monthly = res.monthlyTrend || [];
    this.monthlyChartData = {
      labels: monthly.map((m: any) => m.month || m.Month),
      datasets: [
        {
          data: monthly.map((m: any) => m.count ?? m.Count ?? 0),
          label: 'No. of Claims',
          backgroundColor: '#1e293b',
        },
      ],
    };
    this.summary.total = monthly.reduce(
      (acc: any, cur: any) => acc + (cur.count ?? cur.Count ?? 0),
      0,
    );
    this.summary.totalAmount = monthly.reduce(
      (acc: any, cur: any) =>
        acc + (cur.totalClaimedAmount ?? cur.TotalAmount ?? cur.totalAmount ?? 0),
      0,
    );

    // 3. Risk {low, medium, high} 
    const risk = res.riskWise || {};
    const low = risk.low ?? risk.Low ?? 0;
    const medium = risk.medium ?? risk.Medium ?? 0;
    const high = risk.high ?? risk.High ?? 0;

    this.riskChartData = {
      labels: ['Low Risk', 'Medium Risk', 'High Risk'],
      datasets: [{ data: [low, medium, high], backgroundColor: ['#22c55e', '#f59e0b', '#ef4444'] }],
    };
    this.summary.highRisk = high;

    // 4. Type [{type, count}]
    const type = res.typeWise || [];
    this.typeChartData = {
      labels: type.map((t: any) => t.type || t.Type),
      datasets: [
        {
          data: type.map((t: any) => t.count ?? t.Count ?? 0),
          backgroundColor: ['#06b6d4', '#8b5cf6', '#f97316', '#10b981'],
        },
      ],
    };
  }
}
