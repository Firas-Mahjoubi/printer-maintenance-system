import { Component, EventEmitter, Output, OnInit, HostListener } from '@angular/core';
import { ContratService, Contrat, Utilisateur } from '../../service/contrat.service';
import { NgForm } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-contrat-form',
  templateUrl: './contrat-form.component.html',
  styleUrls: ['./contrat-form.component.css']
})
export class ContratFormComponent implements OnInit {
  contrat: Contrat = {
    numeroContrat: '',
    dateDebut: '',
    dateFin: '',
    statutContrat: '',
    clientId: undefined,
    conditions_contrat: ''
  };

  clients: Utilisateur[] = [];
  filteredClients: Utilisateur[] = [];
  clientSearchTerm: string = '';
  showClientDropdown: boolean = false;
  highlightedIndex: number = -1;
  isSubmitting: boolean = false;
  today: string = new Date().toISOString().split('T')[0];
  validationErrors: any = {};
  showSuccessMessage: boolean = false;
  showErrorMessage: boolean = false;
  errorMessage: string = '';
  loadingClients: boolean = false;
  
  @Output() contratCreated = new EventEmitter<void>();

  constructor(
    private contratService: ContratService, 
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadClients();
    this.generateContractNumber();
  }

  loadClients() {
    this.loadingClients = true;
    this.http.get<Utilisateur[]>('http://localhost:8081/api/Utilisateur/getAllClients')
      .subscribe({
        next: (data) => {
          this.clients = data;
          this.filteredClients = data.slice(0, 10); // Show first 10 clients initially
          this.loadingClients = false;
        },
        error: (err) => {
          console.error('Failed to load clients', err);
          this.loadingClients = false;
          this.showError('Erreur lors du chargement des clients');
        }
      });
  }

  generateContractNumber(): void {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.contrat.numeroContrat = `CONT-${year}-${month}-${random}`;
  }

  getFormProgress(): number {
    let filledFields = 0;
    const totalFields = 5; // Required fields only

    if (this.contrat.numeroContrat?.trim()) filledFields++;
    if (this.contrat.statutContrat) filledFields++;
    if (this.contrat.dateDebut) filledFields++;
    if (this.contrat.dateFin) filledFields++;
    if (this.contrat.clientId) filledFields++;

    return Math.round((filledFields / totalFields) * 100);
  }

  calculateDuration(): number {
    if (!this.contrat.dateDebut || !this.contrat.dateFin) return 0;
    
    const startDate = new Date(this.contrat.dateDebut);
    const endDate = new Date(this.contrat.dateFin);
    const diffTime = endDate.getTime() - startDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  }

  formatDuration(): string {
    const days = this.calculateDuration();
    if (days === 0) return '';
    
    if (days < 30) {
      return `${days} jour${days > 1 ? 's' : ''}`;
    } else if (days < 365) {
      const months = Math.round(days / 30);
      return `${months} mois`;
    } else {
      const years = Math.floor(days / 365);
      const remainingMonths = Math.round((days % 365) / 30);
      if (remainingMonths > 0) {
        return `${years} an${years > 1 ? 's' : ''} et ${remainingMonths} mois`;
      }
      return `${years} an${years > 1 ? 's' : ''}`;
    }
  }

  validateForm(): boolean {
    this.validationErrors = {};
    let isValid = true;

    // Validate contract number
    if (!this.contrat.numeroContrat?.trim()) {
      this.validationErrors.numeroContrat = 'Le numéro de contrat est obligatoire';
      isValid = false;
    } else if (this.contrat.numeroContrat.length < 5) {
      this.validationErrors.numeroContrat = 'Le numéro de contrat doit contenir au moins 5 caractères';
      isValid = false;
    }

    // Validate dates
    if (!this.contrat.dateDebut) {
      this.validationErrors.dateDebut = 'La date de début est obligatoire';
      isValid = false;
    } else if (new Date(this.contrat.dateDebut) < new Date(this.today)) {
      this.validationErrors.dateDebut = 'La date de début ne peut pas être dans le passé';
      isValid = false;
    }

    if (!this.contrat.dateFin) {
      this.validationErrors.dateFin = 'La date de fin est obligatoire';
      isValid = false;
    } else if (this.contrat.dateDebut && new Date(this.contrat.dateFin) <= new Date(this.contrat.dateDebut)) {
      this.validationErrors.dateFin = 'La date de fin doit être postérieure à la date de début';
      isValid = false;
    }

    // Validate status
    if (!this.contrat.statutContrat) {
      this.validationErrors.statutContrat = 'Le statut du contrat est obligatoire';
      isValid = false;
    }

    // Validate client
    if (!this.contrat.clientId) {
      this.validationErrors.clientId = 'La sélection d\'un client est obligatoire';
      isValid = false;
    }

    return isValid;
  }

  // ========== CLIENT SEARCH METHODS - REBUILT ==========
  
  onClientSearch(): void {
    this.filterClients();
    this.showDropdown();
  }

  onClientInputFocus(): void {
    if (!this.showClientDropdown) {
      this.initializeFilteredClients();
      this.showDropdown();
    }
  }

  onClientInputBlur(): void {
    // Use a delay to allow clicks on dropdown items
    setTimeout(() => {
      if (!this.isDropdownActive()) {
        this.hideDropdown();
      }
    }, 200);
  }

  private initializeFilteredClients(): void {
    if (this.clientSearchTerm.trim()) {
      this.filterClients();
    } else {
      this.filteredClients = this.clients.slice(0, 10);
    }
  }

  private filterClients(): void {
    if (!this.clientSearchTerm.trim()) {
      this.filteredClients = this.clients.slice(0, 10);
      return;
    }

    const searchTerm = this.clientSearchTerm.toLowerCase();
    this.filteredClients = this.clients.filter(client => 
      client.nom.toLowerCase().includes(searchTerm) ||
      (client.prenom && client.prenom.toLowerCase().includes(searchTerm)) ||
      (client.email && client.email.toLowerCase().includes(searchTerm)) ||
      client.id.toString().includes(searchTerm)
    );
  }

  private showDropdown(): void {
    this.showClientDropdown = true;
    this.highlightedIndex = -1;
    // Position after DOM updates
    setTimeout(() => this.updateDropdownPosition(), 0);
  }

  private hideDropdown(): void {
    this.showClientDropdown = false;
    this.highlightedIndex = -1;
  }

  private isDropdownActive(): boolean {
    const dropdown = document.querySelector('.client-dropdown');
    return !!(dropdown && dropdown.matches(':hover'));
  }

  private updateDropdownPosition(): void {
    const inputElement = document.getElementById('clientSearch');
    const dropdownElement = document.querySelector('.client-dropdown') as HTMLElement;
    
    if (!inputElement || !dropdownElement) return;

    const inputRect = inputElement.getBoundingClientRect();
    const dropdownHeight = 400;
    const gap = 4;
    
    // Calculate position
    let top = inputRect.bottom + window.scrollY + gap;
    let left = inputRect.left + window.scrollX;
    let width = inputRect.width;
    
    // Adjust for viewport boundaries
    if (inputRect.bottom + dropdownHeight > window.innerHeight) {
      top = inputRect.top + window.scrollY - dropdownHeight - gap;
    }
    
    if (left + width > window.innerWidth - 20) {
      left = window.innerWidth - width - 20;
    }
    
    if (left < 20) {
      left = 20;
      width = Math.min(width, window.innerWidth - 40);
    }
    
    // Apply styles
    Object.assign(dropdownElement.style, {
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      width: `${width}px`,
      zIndex: '99999'
    });
  }

  // ========== CLIENT ACTIONS - REBUILT ==========
  
  selectClient(client: Utilisateur): void {
    this.contrat.clientId = client.id;
    this.clientSearchTerm = `${client.nom} ${client.prenom || ''}`.trim();
    this.hideDropdown();
    this.clearValidationError('clientId');
  }

  clearClientSearch(): void {
    this.clientSearchTerm = '';
    this.contrat.clientId = undefined;
    this.filteredClients = this.clients.slice(0, 10);
    this.hideDropdown();
  }

  showAllClients(): void {
    this.clientSearchTerm = '';
    this.filteredClients = this.clients;
    this.showDropdown();
  }

  private clearValidationError(field: string): void {
    if (this.validationErrors[field]) {
      delete this.validationErrors[field];
    }
  }

  getClientInitials(client: Utilisateur): string {
    const firstNameInitial = client.prenom ? client.prenom.charAt(0).toUpperCase() : '';
    const lastNameInitial = client.nom ? client.nom.charAt(0).toUpperCase() : '';
    return firstNameInitial + lastNameInitial || 'CL';
  }

  trackByClientId(index: number, client: Utilisateur): number {
    return client.id;
  }

  // Update existing getSelectedClient method
  getSelectedClient(): Utilisateur | undefined {
    return this.clients.find(client => client.id === this.contrat.clientId);
  }

  saveDraft(): void {
    this.contrat.statutContrat = 'BROUILLON';
    this.onSubmit(null, true);
  }

  showSuccess(message: string): void {
    this.showSuccessMessage = true;
    setTimeout(() => this.showSuccessMessage = false, 5000);
  }

  showError(message: string): void {
    this.errorMessage = message;
    this.showErrorMessage = true;
    setTimeout(() => this.showErrorMessage = false, 7000);
  }

  onSubmit(form: NgForm | null, isDraft: boolean = false): void {
    if (!isDraft && !this.validateForm()) {
      this.showError('Veuillez corriger les erreurs avant de soumettre le formulaire');
      return;
    }

    if (form && form.invalid && !isDraft) {
      this.showError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    this.isSubmitting = true;
    const clientId = this.contrat.clientId!;
    const payload = { ...this.contrat };
    delete payload.clientId;

    this.contratService.create(payload, clientId).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.showSuccess(isDraft ? 'Brouillon enregistré avec succès!' : 'Contrat créé avec succès!');
        this.contratCreated.emit();
        
        if (form) {
          form.resetForm();
        }
        
        // Reset using our private method
        this.resetForm();
        
        // Redirect to contract details if not a draft
        if (!isDraft && response?.id) {
          setTimeout(() => {
            this.router.navigate(['/contrat-details', response.id]);
          }, 2000);
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('Failed to create contract', err);
        
        // Handle specific error types
        let errorMessage = 'Erreur lors de la création du contrat. Veuillez réessayer.';
        
        if (err.error?.message) {
          if (err.error.message.includes('contrainte de vérification') || 
              err.error.message.includes('constraint')) {
            errorMessage = 'Erreur de validation : Une des valeurs saisies n\'est pas acceptée par le système. Veuillez vérifier le statut du contrat.';
          } else if (err.error.message.includes('duplicate') || 
                     err.error.message.includes('unique')) {
            errorMessage = 'Ce numéro de contrat existe déjà. Veuillez générer un nouveau numéro.';
          } else {
            errorMessage = err.error.message;
          }
        }
        
        this.showError(errorMessage);
      }
    });
  }

  cancel(): void {
    // Check if form has unsaved changes
    const hasChanges = this.contrat.numeroContrat !== '' || 
                      this.contrat.dateDebut !== '' || 
                      this.contrat.dateFin !== '' || 
                      this.contrat.statutContrat !== '' || 
                      this.contrat.clientId !== undefined || 
                      this.contrat.conditions_contrat !== '';

    if (hasChanges) {
      if (confirm('Êtes-vous sûr de vouloir annuler? Les données non sauvegardées seront perdues.')) {
        this.resetForm();
        this.router.navigate(['/contrats']);
      }
    } else {
      this.router.navigate(['/contrats']);
    }
  }

  private resetForm(): void {
    this.contrat = {
      numeroContrat: '',
      dateDebut: '',
      dateFin: '',
      statutContrat: '',
      clientId: undefined,
      conditions_contrat: ''
    };
    this.validationErrors = {};
    this.showSuccessMessage = false;
    this.showErrorMessage = false;
    this.generateContractNumber();
  }

  // ========== EVENT HANDLERS - REBUILT ==========
  
  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (!this.showClientDropdown || this.filteredClients.length === 0) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.highlightedIndex = Math.min(this.highlightedIndex + 1, this.filteredClients.length - 1);
        this.scrollToHighlighted();
        break;

      case 'ArrowUp':
        event.preventDefault();
        this.highlightedIndex = Math.max(this.highlightedIndex - 1, -1);
        this.scrollToHighlighted();
        break;

      case 'Enter':
        event.preventDefault();
        if (this.highlightedIndex >= 0 && this.highlightedIndex < this.filteredClients.length) {
          this.selectClient(this.filteredClients[this.highlightedIndex]);
        }
        break;

      case 'Escape':
        event.preventDefault();
        this.hideDropdown();
        break;
    }
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    if (this.showClientDropdown) {
      this.updateDropdownPosition();
    }
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    if (this.showClientDropdown) {
      this.updateDropdownPosition();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.showClientDropdown) return;

    const target = event.target as HTMLElement;
    const input = document.getElementById('clientSearch');
    const dropdown = document.querySelector('.client-dropdown');
    
    // Keep dropdown open if clicking on input or dropdown
    if ((input && input.contains(target)) || 
        (dropdown && dropdown.contains(target))) {
      return;
    }
    
    // Hide dropdown if clicking outside
    this.hideDropdown();
  }

  private scrollToHighlighted(): void {
    // Scroll to highlighted item in dropdown
    setTimeout(() => {
      const highlightedElement = document.querySelector('.client-dropdown-item.highlighted');
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    });
  }
}
