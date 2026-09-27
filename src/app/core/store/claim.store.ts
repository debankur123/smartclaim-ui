import { computed, inject, Injectable, signal } from '@angular/core';
import { Claims } from '../services/claims';

@Injectable({
  providedIn: 'root',
})
export class ClaimStore {
  Claims: any[] = [];
  private claimService = inject(Claims);

  private _claims    = signal<any[]>([]);
  private _dashboard = signal<any>(null);
  private _report    = signal<any>(null);
  private _loading   = signal<boolean>(false);

  claims    = this._claims.asReadonly();
  dashboard = this._dashboard.asReadonly();
  report    = this._report.asReadonly();
  loading   = this._loading.asReadonly();

  //claim signals : Auto updates when _claims changes. No manual Calculation
  totalClaims   = computed(() => Array.isArray(this._claims()) ? this._claims().length : 0);
  totalAmount   = computed(() => {
    const list = this._claims();
    if (!Array.isArray(list)) return 0;
    return list.reduce((acc, c) => acc + (c.claimedAmount || 0), 0);
  });
  highRiskCount = computed(() => {
    const list = this._claims();
    if (!Array.isArray(list)) return 0;
    return list.filter(c => c.fraudRiskScore >= 60).length;
  });

  // For reports compute from signal
  statusWise = computed(() => this._report().statusWise || []);
  monthly    = computed(() => this._report().monthlyTrend || []);
  riskWise   = computed(() => this._report().riskWise || {low:0,medium:0,high:0});
  typeWise   = computed(() => this._report().typeWise || []);

  //cards data
  pendingCount = computed(() => {
    const list = this._claims();
    if (!Array.isArray(list)) return 0;
    return list.filter((c:any) => c.status === 'Submitted').length;
  });
  approvedCount = computed(() => {
    const list = this._claims();
    if (!Array.isArray(list)) return 0;
    return list.filter((c:any) => c.status === 'Approved' || c.status === 'Settled').length;
  });

  //Actions to load Data
  LoadClaims() {
    this.claimService.GetClaims().subscribe({
      next : (res:any) => {
        const arr = Array.isArray(res) ? res : (res.data || res.claims || []);
        this._claims.set(arr);
        this.Claims = arr;
        this._loading.set(false);
      },
      error : (err:any) => {
        console.error('Error loading claims:', err);
        this._loading.set(false);
      },
      complete : () => {
        console.log('Claims loaded successfully');
        this._loading.set(false);
      }
    })
  }

  FetchDashboardClaimDetails(){
    this.claimService.FetchDashboardData().subscribe({
      next : (res:any) => {
        this._dashboard.set(res);
        if (res.claims && Array.isArray(res.claims)) {
          this._claims.set(res.claims);
        } else if (Array.isArray(res)) {
          this._claims.set(res);
        }
        this._loading.set(false);
      },
      error : (err:any) => {
        console.error('Error loading dashboard data:', err);
        this._loading.set(false);
      },
      complete : () => {
        console.log('Dashboard data loaded successfully');
        this._loading.set(false);
      }
    })
  }

  LoadReportData() {
    if (this._report()) return;
    this.claimService.GetReportData().subscribe({
      next : (res:any) => {
        this._report.set(res);
      },
      error : (err:any) => {
        console.error('Error loading report data:', err);
      },
      complete : () => {
        console.log('Report data loaded successfully');
      }
    })
  }
}
