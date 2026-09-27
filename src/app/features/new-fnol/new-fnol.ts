import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Claims } from '../../core/services/claims';
import { Router } from '@angular/router';
import * as pdfjsLib from 'pdfjs-dist';
import { createWorker } from 'tesseract.js';
import { catchError, debounceTime, distinctUntilChanged, filter, finalize, from, of, Subject, switchMap, tap } from 'rxjs';
// Required for pdfjs
(pdfjsLib as any).GlobalWorkerOptions.workerSrc =
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

@Component({
  selector: 'app-new-fnol',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './new-fnol.html',
  styleUrl: './new-fnol.css',
})
export class NewFnol implements OnInit {
  ngOnInit() {
  // Typeahead - same
  this.fnolForm.get('policyNumber')!.valueChanges.pipe(
    debounceTime(400),
    distinctUntilChanged(),
    filter((term: string | null) => !!term && (term as string).length >= 2)
  ).subscribe(term => {
    this.suggestions = this.mockPolicies.filter(p => p.toLowerCase().includes((term as string).toLowerCase()));
    this.showSuggestions = this.suggestions.length > 0;
  });
  this.fileSubject.pipe(
    tap(() => {
      this.isScanning = true;
      this.ocrText = 'Reading document...';
    }),
    switchMap(file => 
      from(this.readFileWithOCR(file)).pipe(
        catchError(err => {
          console.error(err);
          this.ocrText = 'Could not read. Enter amount manually.';
          return of('');
        }),
        finalize(() => {
          this.isScanning = false;
        })
      )
    )
  ).subscribe(text => {
    if (text) {
      this.ocrText = text;
      this.extractAmount(text);
    }
  });
}



  selectedFile: File | null = null;
  ocrText: string = '';
  isScanning: boolean = false;
  extractedAmount: number | null = null;
  isSubmitting = false;

  //For debounce
  suggestions: string[] = [];
  showSuggestions: boolean = false;
  private mockPolicies = ['231200312400001145','231200312400001146','231200312400001147','POL12345','POL10001'];
  private fileSubject = new Subject<File>();
  private fb = inject(FormBuilder);
  private claimsService = inject(Claims);
  private router = inject(Router);

  fnolForm = this.fb.group({
    policyNumber: ['', Validators.required],
    claimType: ['Motor', Validators.required],
    policyType: ['Comprehensive', Validators.required],
    claimedAmount: [0, Validators.required],
  });

  // async OnFileSelected(event: any) {
  //   this.selectedFile = event.target.files[0];
  //   if (!this.selectedFile) {
  //     return;
  //   }
  //   this.isScanning = true;
  //   this.ocrText = 'Reading document...';
  //   let fullText = '';
  //   try {
  //     if (this.selectedFile.type === 'application/pdf') {
  //       const arrayBuffer = await this.selectedFile.arrayBuffer();
  //       const pdf = await (pdfjsLib as any).getDocument({ data: arrayBuffer }).promise;
  //       const page = await pdf.getPage(1);
  //       const textContent = await page.getTextContent();
  //       fullText = textContent.items.map((item: any) => item.str).join(' ');
  //     } else {
  //       //Image tesseract.js OCR
  //       const worker = await createWorker('eng');
  //       const ret = await worker.recognize(this.selectedFile);
  //       fullText = ret.data.text;
  //       await worker.terminate();
  //     }
  //     this.ocrText = fullText;
  //     // Regex to find amount - works for all 3 bills you have
  //     const regexes = [/Total Amount:\s*Rs\.?\s*([0-9,]+)/i, /₹\s*([0-9,]+)/, /Rs\.?\s*([0-9,]+)/i];
  //     for (const regex of regexes) {
  //       const match = fullText.match(regex);
  //       if (match) {
  //         const clean = match[1].replace(/,/g, '');
  //         this.extractedAmount = parseInt(clean);
  //         this.fnolForm.patchValue({ claimedAmount: this.extractedAmount });
  //         break;
  //       }
  //     }
  //   } catch (err) {
  //     console.error('Read error', err);
  //     this.ocrText = 'Could not read. Please enter amount manually.';
  //   }
  //   this.isScanning = false;
  // }
  OnFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.fileSubject.next(file); // RxJS cancels previous if any
    }
    else{
      return;
    }
  }

  Submit() {
    if (this.fnolForm.invalid || ! this.selectedFile) {
      this.fnolForm.markAllAsTouched();
      return;
    }
    this.isSubmitting = true;
    const formData = new FormData();
    Object.keys(this.fnolForm.value).forEach((key) => {
      formData.append(
        key,
        this.fnolForm.value[key as keyof typeof this.fnolForm.value] as string | Blob,
      );
    });
    if (this.selectedFile) {
      formData.append('document', this.selectedFile);
    }

    this.claimsService.CreateClaimWithDocument(formData).subscribe({
      next: (response) => {
        alert(
          `Claim Created! AI read ₹${this.extractedAmount}, Payable: ₹${response.settlement.payableAmount}`,
        );
        this.router.navigate(['/claims']);
      },
      error: (error) => {
        console.log(error);
        this.isSubmitting = false;
      },
    });
    return;
  }

  
  SelectSuggestion(suggestion: string) {
    this.fnolForm.patchValue({ policyNumber: suggestion });
    this.showSuggestions = false;
  }

  private async readFileWithOCR(file: File): Promise<string> {
    if (file.type === 'application/pdf') {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await (pdfjsLib as any).getDocument({ data: arrayBuffer }).promise;
      const page = await pdf.getPage(1);
      const textContent = await page.getTextContent();
      return textContent.items.map((item: any) => item.str).join(' ');
    }
    else{
      const worker = await createWorker('eng');
      const ret = await worker.recognize(file);
      await worker.terminate();
      return ret.data.text;
    }
  }

  private extractAmount(text: string) {
    const regexes = [/Total Amount:\s*Rs\.?\s*([0-9,]+)/i, /₹\s*([0-9,]+)/, /Rs\.?\s*([0-9,]+)/i];
    for (const regex of regexes) {
      const match = text.match(regex);
      if (match) {
        const clean = match[1].replace(/,/g, '');
        this.extractedAmount = parseInt(clean);
        this.fnolForm.patchValue({ claimedAmount: this.extractedAmount });
        break;
      }
    }
  }

}
