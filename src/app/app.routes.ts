import { Routes } from '@angular/router';
import { ClaimList } from './features/claims/claim-list/claim-list';
import { NewFnol } from './features/new-fnol/new-fnol';
import { ClaimDetails } from './features/claims/claim-details/claim-details';
import { Reports } from './features/reports/reports/reports';

export const routes: Routes = [
    {path : '',component : ClaimList},
    {path : 'claims',component : ClaimList},
    {path : 'claims/newfnol',component : NewFnol},
    { path: 'claims-details/:id', component: ClaimDetails },
    { path: 'reports', component:  Reports},
];
