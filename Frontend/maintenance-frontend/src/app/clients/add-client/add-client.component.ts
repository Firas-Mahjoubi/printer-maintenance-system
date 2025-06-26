import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ClientService, CreateClientRequest } from '../../service/client.service';

@Component({
  selector: 'app-add-client',
  templateUrl: './add-client.component.html',
  styleUrls: ['./add-client.component.css']
})
export class AddClientComponent implements OnInit {
  clientForm: FormGroup;
  loading = false;
  error: string | null = null;
  success = false;

  constructor(
    private fb: FormBuilder,
    private clientService: ClientService,
    private router: Router
  ) {
    this.clientForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      prenom: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      telephone: ['', [Validators.required, Validators.pattern(/^[0-9\s\-\+\(\)]+$/)]],
      imageUrl: ['', [Validators.pattern(/^https?:\/\/.+\.(jpg|jpeg|png|gif|bmp|webp)$/i)]]
    });
  }

  ngOnInit(): void {}

  onSubmit(): void {
    if (this.clientForm.valid) {
      this.loading = true;
      this.error = null;

      const clientData: CreateClientRequest = this.clientForm.value;

      this.clientService.createClient(clientData).subscribe({
        next: (response) => {
          this.success = true;
          this.loading = false;
          // Redirect to clients list after 2 seconds
          setTimeout(() => {
            this.router.navigate(['/clients']);
          }, 2000);
        },
        error: (error) => {
          this.loading = false;
          if (error.status === 400) {
            this.error = 'Données invalides. Veuillez vérifier les informations saisies.';
          } else if (error.status === 409) {
            this.error = 'Un client avec cet email existe déjà.';
          } else {
            this.error = 'Erreur lors de la création du client. Veuillez réessayer.';
          }
          console.error('Error creating client:', error);
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  onCancel(): void {
    this.router.navigate(['/clients']);
  }

  onReset(): void {
    this.clientForm.reset();
    this.error = null;
    this.success = false;
  }

  private markFormGroupTouched(): void {
    Object.keys(this.clientForm.controls).forEach(key => {
      const control = this.clientForm.get(key);
      control?.markAsTouched();
    });
  }

  // Helper methods for form validation
  isFieldInvalid(fieldName: string): boolean {
    const field = this.clientForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.clientForm.get(fieldName);
    if (field && field.errors && field.touched) {
      if (field.errors['required']) {
        return `${this.getFieldLabel(fieldName)} est requis.`;
      }
      if (field.errors['minlength']) {
        return `${this.getFieldLabel(fieldName)} doit contenir au moins ${field.errors['minlength'].requiredLength} caractères.`;
      }
      if (field.errors['maxlength']) {
        return `${this.getFieldLabel(fieldName)} ne peut pas dépasser ${field.errors['maxlength'].requiredLength} caractères.`;
      }
      if (field.errors['email']) {
        return 'Format d\'email invalide.';
      }
      if (field.errors['pattern']) {
        if (fieldName === 'telephone') {
          return 'Format de téléphone invalide.';
        }
        if (fieldName === 'imageUrl') {
          return 'URL d\'image invalide. Formats acceptés: jpg, jpeg, png, gif, bmp, webp.';
        }
      }
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      nom: 'Le nom',
      prenom: 'Le prénom',
      email: 'L\'email',
      telephone: 'Le téléphone',
      imageUrl: 'L\'URL de l\'image'
    };
    return labels[fieldName] || fieldName;
  }
}
