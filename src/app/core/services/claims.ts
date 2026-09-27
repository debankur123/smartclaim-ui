import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class Claims {
  private httpClient = inject(HttpClient);

  private apiUrl = environment.apiURL;

  GetClaims(): Observable<any[]> {
    return this.httpClient.get<any[]>(this.apiUrl + '/Claim/GetClaims');
  }

  GenerateClaim(claim: any): Observable<any> {
    return this.httpClient.post<any>(this.apiUrl + '/Claim/GenerateClaim', claim);
  }

  CreateClaimWithDocument(formData: FormData): Observable<any> {
    return this.httpClient.post<any>(this.apiUrl + '/Claim/CreateWithDocs', formData);
  }
  FetchDashboardData(): Observable<any> {
    return this.httpClient.get<any>(this.apiUrl + '/Claim/GetClaimsDashboardData');
  }
  GetClaimDetailsById(id: Number): Observable<any> {
    return this.httpClient.get<any>(this.apiUrl + '/Claim/GetClaimDetailsById?id=' + id);
  }
  UpdateStatus(id: number, status: string): Observable<any> {
    return this.httpClient.post<any>(`${this.apiUrl}/Claim/UpdateClaimStatus?id=${id}&status=${status}`, {});
  }
  GetReportData():Observable<any>{
    return this.httpClient.get<any>(this.apiUrl+'/Claim/GetClaimsReportsData');
  }
}
