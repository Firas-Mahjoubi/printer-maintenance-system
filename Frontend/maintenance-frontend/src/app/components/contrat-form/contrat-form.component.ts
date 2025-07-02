import { Component, EventEmitter, Output, OnInit, HostListener, ViewChild, ElementRef, Renderer2 } from '@angular/core';
import { ContratService, Contrat, Utilisateur } from '../../service/contrat.service';
import { NgForm } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { NotificationService } from '../../service/notification.service';

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
  loadingClients: boolean = false;

  // Pagination properties
  pageSize: number = 5;
  currentPage: number = 1;
  totalPages: number = 1;
  paginatedClients: Utilisateur[] = [];
  
  @ViewChild('searchInput') searchInput!: ElementRef;
  @ViewChild('dropdownPanel') dropdownPanel!: ElementRef;

  private unlistenClick: (() => void) | undefined;

  @Output() contratCreated = new EventEmitter<void>();

  // Flag to track if we're currently checking for duplicate contract numbers
  checkingContractNumber: boolean = false;
  
  // Flag to track if the contract number is unique
  contractNumberIsUnique: boolean = true;
  
  // Message to display if contract number is not unique
  contractNumberError: string = '';

  constructor(
    private contratService: ContratService, 
    private http: HttpClient,
    private router: Router,
    private renderer: Renderer2,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadClients();
    this.generateContractNumber();
  }

  ngAfterViewInit(): void {
    // Add safety checks to ensure ViewChild elements are properly initialized
    setTimeout(() => {
      if (this.dropdownPanel && this.dropdownPanel.nativeElement) {
        // Only append to body if element exists
        this.renderer.appendChild(document.body, this.dropdownPanel.nativeElement);
        
        // Set up click listener with proper null checks
        this.unlistenClick = this.renderer.listen('window', 'click', (e: Event) => {
          if (this.showClientDropdown && 
              this.searchInput && this.searchInput.nativeElement && 
              this.dropdownPanel && this.dropdownPanel.nativeElement) {
            
            const isClickInside = this.searchInput.nativeElement.contains(e.target as Node) || 
                                 this.dropdownPanel.nativeElement.contains(e.target as Node);
                                 
            if (!isClickInside) {
              this.hideDropdown();
            }
          }
        });
      }
    });
  }

  ngOnDestroy(): void {
    if (this.dropdownPanel && this.dropdownPanel.nativeElement && this.dropdownPanel.nativeElement.parentElement === document.body) {
      this.renderer.removeChild(document.body, this.dropdownPanel.nativeElement);
    }
    if (this.unlistenClick) {
      this.unlistenClick();
    }
  }

  loadClients() {
    this.loadingClients = true;
    this.http.get<Utilisateur[]>('http://localhost:8081/api/Utilisateur/getAllClients')
      .subscribe({
        next: (data) => {
          this.clients = data;
          // Initialize filtered clients with first pageSize items instead of hardcoding 10
          this.filteredClients = data.slice(0, this.pageSize * 2); 
          this.loadingClients = false;
          
          // Initialize pagination to show first page of clients
          this.updatePagination();
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
    
    // Check if the generated contract number is unique
    this.checkContractNumberUnique();
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
    let errorMessages = [];

    // Validate contract number
    if (!this.contrat.numeroContrat?.trim()) {
      this.validationErrors.numeroContrat = 'Le numéro de contrat est obligatoire';
      errorMessages.push('Le numéro de contrat est obligatoire');
      isValid = false;
    } else if (this.contrat.numeroContrat.length < 5) {
      this.validationErrors.numeroContrat = 'Le numéro de contrat doit contenir au moins 5 caractères';
      errorMessages.push('Le numéro de contrat doit contenir au moins 5 caractères');
      isValid = false;
    } else if (!this.contractNumberIsUnique) {
      this.validationErrors.numeroContrat = this.contractNumberError || 'Ce numéro de contrat existe déjà';
      errorMessages.push(this.contractNumberError || 'Ce numéro de contrat existe déjà');
      isValid = false;
    }

    // Validate dates
    if (!this.contrat.dateDebut) {
      this.validationErrors.dateDebut = 'La date de début est obligatoire';
      errorMessages.push('La date de début est obligatoire');
      isValid = false;
    } else if (new Date(this.contrat.dateDebut) < new Date(this.today)) {
      this.validationErrors.dateDebut = 'La date de début ne peut pas être dans le passé';
      errorMessages.push('La date de début ne peut pas être dans le passé');
      isValid = false;
    }

    if (!this.contrat.dateFin) {
      this.validationErrors.dateFin = 'La date de fin est obligatoire';
      errorMessages.push('La date de fin est obligatoire');
      isValid = false;
    } else if (this.contrat.dateDebut && new Date(this.contrat.dateFin) <= new Date(this.contrat.dateDebut)) {
      this.validationErrors.dateFin = 'La date de fin doit être postérieure à la date de début';
      errorMessages.push('La date de fin doit être postérieure à la date de début');
      isValid = false;
    }

    // Validate status
    if (!this.contrat.statutContrat) {
      this.validationErrors.statutContrat = 'Le statut du contrat est obligatoire';
      errorMessages.push('Le statut du contrat est obligatoire');
      isValid = false;
    }

    // Validate client
    if (!this.contrat.clientId) {
      this.validationErrors.clientId = 'La sélection d\'un client est obligatoire';
      errorMessages.push('La sélection d\'un client est obligatoire');
      isValid = false;
    }

    // Show toast notification with validation errors
    if (!isValid) {
      this.notificationService.showError(
        `Erreurs de validation:<br>• ${errorMessages.join('<br>• ')}`, 
        'Erreur de validation'
      );
    }

    return isValid;
  }

  // ========== CLIENT SEARCH METHODS - SIMPLIFIED ==========
  
  onClientSearch(): void {
    this.filterClients();
    this.showDropdown();
  }

  onClientInputFocus(): void {
    this.initializeFilteredClients();
    this.showDropdown();
  }

  // Remove the problematic blur handler
  onClientInputBlur(): void {
    // Let CSS handle the dropdown visibility
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
    } else {
      const searchTerm = this.clientSearchTerm.toLowerCase();
      this.filteredClients = this.clients.filter(client => 
        client.nom.toLowerCase().includes(searchTerm) ||
        (client.prenom && client.prenom.toLowerCase().includes(searchTerm)) ||
        (client.email && client.email.toLowerCase().includes(searchTerm)) ||
        client.id.toString().includes(searchTerm)
      );
    }
    
    this.updatePagination();
  }

  // Pagination methods
  private updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredClients.length / this.pageSize);
    this.currentPage = this.totalPages > 0 ? 1 : 0;
    this.updatePaginatedClients();
  }

  private updatePaginatedClients(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    this.paginatedClients = this.filteredClients.slice(startIndex, startIndex + this.pageSize);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginatedClients();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedClients();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedClients();
    }
  }

  private showDropdown(): void {
    if (!this.showClientDropdown) {
      this.showClientDropdown = true;
      this.highlightedIndex = -1;
    }
    setTimeout(() => this.positionDropdown(), 0);
  }

  private hideDropdown(): void {
    if (this.showClientDropdown && this.dropdownPanel && this.dropdownPanel.nativeElement) {
      this.renderer.setStyle(this.dropdownPanel.nativeElement, 'display', 'none');
      this.showClientDropdown = false;
      this.highlightedIndex = -1;
    }
  }

  private positionDropdown(): void {
    if (!this.showClientDropdown || 
        !this.searchInput || !this.searchInput.nativeElement || 
        !this.dropdownPanel || !this.dropdownPanel.nativeElement) {
      return;
    }

    const dropdown = this.dropdownPanel.nativeElement;
    const inputRect = this.searchInput.nativeElement.getBoundingClientRect();
    
    // Only append to document body if not already there
    if (dropdown.parentElement !== document.body) {
      this.renderer.appendChild(document.body, dropdown);
    }
    
    const dropdownHeight = Math.min(300, this.filteredClients.length * 60 + 60);
    
    let top = inputRect.bottom + window.scrollY + 4;
    let left = inputRect.left + window.scrollX;
    let width = Math.max(inputRect.width, 300);
    
    if (top + dropdownHeight > window.innerHeight + window.scrollY) {
      top = inputRect.top + window.scrollY - dropdownHeight - 4;
    }
    
    if (left + width > window.innerWidth) {
      left = window.innerWidth - width - 20;
    }
    
    if (left < 20) {
      left = 20;
      width = Math.min(width, window.innerWidth - 40);
    }
    
    this.renderer.setStyle(dropdown, 'position', 'absolute');
    this.renderer.setStyle(dropdown, 'top', `${top}px`);
    this.renderer.setStyle(dropdown, 'left', `${left}px`);
    this.renderer.setStyle(dropdown, 'width', `${width}px`);
    this.renderer.setStyle(dropdown, 'z-index', '2147483647');
    this.renderer.setStyle(dropdown, 'display', 'block');
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
    // Use only the notification service instead of showing inline messages
    this.notificationService.showSuccess(message);
  }

  showError(message: string): void {
    // Use only the notification service instead of showing inline messages
    this.notificationService.showError(message);
  }

  onSubmit(form: NgForm | null, isDraft: boolean = false): void {
    // Don't validate for drafts or if the form is invalid
    if (!isDraft && !this.validateForm()) {
      this.notificationService.showError('Veuillez corriger les erreurs avant de soumettre le formulaire');
      return;
    }

    if (form && form.invalid && !isDraft) {
      this.notificationService.showError('Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    // First check if the contract number is unique
    if (!isDraft && this.contrat.numeroContrat) {
      this.checkingContractNumber = true;
      
      this.contratService.checkContractNumberExists(this.contrat.numeroContrat).subscribe({
        next: (exists) => {
          this.contractNumberIsUnique = !exists;
          this.checkingContractNumber = false;
          
          if (!this.contractNumberIsUnique) {
            this.contractNumberError = 'Ce numéro de contrat existe déjà. Veuillez en choisir un autre.';
            this.notificationService.showError(this.contractNumberError);
            return;
          }
          
          // If contract number is unique, proceed with form submission
          this.submitForm(form, isDraft);
        },
        error: (err) => {
          console.error('Error checking contract number uniqueness', err);
          this.checkingContractNumber = false;
          // If there's an error, we'll assume it's unique and proceed
          this.submitForm(form, isDraft);
        }
      });
    } else {
      // For drafts, we don't need to check for uniqueness
      this.submitForm(form, isDraft);
    }
  }
  
  // New method to handle actual form submission after validation
  private submitForm(form: NgForm | null, isDraft: boolean): void {
    this.isSubmitting = true;
    const clientId = this.contrat.clientId!;
    const payload = { ...this.contrat };
    delete payload.clientId;

    this.contratService.create(payload, clientId).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        const successMessage = isDraft ? 'Brouillon enregistré avec succès!' : 'Contrat créé avec succès!';
        
        // Show only a toast notification
        this.notificationService.showSuccess(successMessage);
        
        this.contratCreated.emit();
        
        if (form) {
          form.resetForm();
        }
        
        // Reset using our private method
        this.resetForm();
        
        // Redirect to contracts list after success
        if (!isDraft) {
          setTimeout(() => {
            this.router.navigate(['/contrats']);
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
        
        // Show only toast notifications for errors
        this.notificationService.showError(errorMessage);
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
        this.notificationService.showInfo('Création de contrat annulée', 'Information');
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

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    // Now handled by renderer listener in ngAfterViewInit
  }

  private scrollToHighlighted(): void {
    // Scroll to highlighted item in dropdown
    setTimeout(() => {
      const highlightedElement = document.querySelector('.client-item.highlighted');
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    });
  }

  // Check if contract number already exists
  checkContractNumberUnique(): void {
    // Don't check if the contract number is empty
    if (!this.contrat.numeroContrat?.trim()) {
      this.contractNumberIsUnique = true;
      this.checkingContractNumber = false;
      return;
    }
    
    this.checkingContractNumber = true;
    this.contractNumberIsUnique = true; // Assume it's unique until proven otherwise
    
    this.contratService.checkContractNumberExists(this.contrat.numeroContrat).subscribe({
      next: (exists) => {
        this.contractNumberIsUnique = !exists;
        this.checkingContractNumber = false;
        
        if (!this.contractNumberIsUnique) {
          this.contractNumberError = 'Ce numéro de contrat existe déjà. Veuillez en choisir un autre.';
          // Show a toast notification for duplicate contract numbers
          this.notificationService.showWarning(this.contractNumberError, 'Attention');
        }
      },
      error: (err) => {
        console.error('Error checking contract number uniqueness', err);
        // If there's an error, we'll assume it's unique to avoid blocking the form
        this.contractNumberIsUnique = true;
        this.checkingContractNumber = false;
        this.notificationService.showError('Erreur lors de la vérification du numéro de contrat', 'Erreur système');
      }
    });
  }
}
