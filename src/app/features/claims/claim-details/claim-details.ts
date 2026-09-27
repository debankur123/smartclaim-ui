import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Claims } from '../../../core/services/claims';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-claim-details',
  imports: [CommonModule],
  templateUrl: './claim-details.html',
  styleUrl: './claim-details.css',
})
export class ClaimDetails implements OnInit {

  claim: any = null;
  id!: number;
  isLoading = true;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private claimsService = inject(Claims);


  ngOnInit(): void {
    this.isLoading = true;
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.fetchClaimDetails();
  }

  private fetchClaimDetails() {
    this.claimsService.GetClaimDetailsById(this.id).subscribe({
      next: (claim) => {
        this.claim = claim;
        this.isLoading = false;
        //this.router.navigate(['/claims']);
      },
      error: (error) => {
        console.error('Error fetching claim details:', error);
        this.isLoading = false;
      }
    });
  }

  UpdateClaimStatus(newStatus: string) {
    this.claimsService.UpdateStatus(this.id, newStatus).subscribe({
      next: (response) => {
        this.claim.status = newStatus;
        console.log('Claim status updated successfully:', response);
      },
      error: (error) => {
        console.error('Error updating claim status:', error);
      }
    });
  }

  GoBack() {
    this.router.navigate(['/claims']);
  }

}
