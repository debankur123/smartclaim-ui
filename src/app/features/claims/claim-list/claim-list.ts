import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Claims } from '../../../core/services/claims';
import { RouterModule } from '@angular/router';
import { ClaimStore } from '../../../core/store/claim.store';

@Component({
  selector: 'app-claim-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './claim-list.html',
  styleUrl: './claim-list.css',
})
export class ClaimList implements OnInit {
  Claims: any[] = [];
  filteredClaims: any[] = [];
  dashboardData: any = {};

  searchTerm = '';
  pageSize = 10;
  currentPage = 1;

  private claimsService = inject(Claims);
  public claimStore = inject(ClaimStore);

  ngOnInit(): void {
    this.claimStore.LoadClaims();
    this.claimStore.FetchDashboardClaimDetails();
    setTimeout(() => {
      console.log('Claims from store:', this.claimStore.claims());
    }, 2000);
  }

  LoadClaims() {
    this.claimsService.FetchDashboardData().subscribe({
      next: (res: any) => (this.dashboardData = res),
    });
  }

  GetClaims() {
    this.claimsService.GetClaims().subscribe({
      next: (res: any[]) => {
        this.Claims = res;
        this.filteredClaims = res;
      },
    });
  }

  get searchFiltered() {
    const all = this.claimStore.claims();
    if (!Array.isArray(all)) return [];
    if (!this.searchTerm) return all;

    const term = this.searchTerm.toLowerCase();
    return all.filter(
      (c: any) =>
        c.claimNumber?.toLowerCase().includes(term) || c.policyNumber?.toLowerCase().includes(term),
    );
  }

  get pagedClaims() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.searchFiltered.slice(start, start + this.pageSize);
  }

  get totalPages() {
    return Math.ceil(this.searchFiltered.length / this.pageSize) || 1;
  }

  onSearch() {
    this.currentPage = 1;
  }
}
