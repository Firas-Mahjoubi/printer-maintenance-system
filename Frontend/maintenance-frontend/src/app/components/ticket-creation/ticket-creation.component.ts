import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { InterventionService, InterventionCreateDTO, TypeIntervention, PrioriteIntervention } from '../../service/intervention.service';
import { ContratService } from '../../service/contrat.service';
import { ClientService } from '../../service/client.service';
import { AuthService } from '../../service/auth.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-ticket-creation',
  templateUrl: './ticket-creation.component.html',
  styleUrls: ['./ticket-creation.component.css']
})
export class TicketCreationComponent implements OnInit {
  ticketForm: FormGroup;
  isSubmitting = false;
  contrats: any[] = [];
  contratsFiltered: any[] = [];
  imprimantes: any[] = [];
  
  // Variables pour la recherche de contrats
  contratSearchTerm = '';
  showContratTable = false;
  selectedContrat: any = null;
  
  typeOptions = [
    { value: TypeIntervention.CORRECTIVE, label: 'Corrective' },
    { value: TypeIntervention.PREVENTIVE, label: 'Préventive' },
    { value: TypeIntervention.URGENTE, label: 'Urgente' },
    { value: TypeIntervention.INSTALLATION, label: 'Installation' },
    { value: TypeIntervention.MAINTENANCE, label: 'Maintenance' },
    { value: TypeIntervention.FORMATION, label: 'Formation' }
  ];
  
  prioriteOptions = [
    { value: PrioriteIntervention.BASSE, label: 'Basse', class: 'success' },
    { value: PrioriteIntervention.NORMALE, label: 'Normale', class: 'info' },
    { value: PrioriteIntervention.HAUTE, label: 'Haute', class: 'warning' },
    { value: PrioriteIntervention.CRITIQUE, label: 'Critique', class: 'danger' }
  ];

  constructor(
    private fb: FormBuilder,
    private interventionService: InterventionService,
    private contratService: ContratService,
    private clientService: ClientService,
    private authService: AuthService,
    private router: Router
  ) {
    this.ticketForm = this.fb.group({
      titre: ['', [Validators.required, Validators.minLength(5)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      type: [TypeIntervention.CORRECTIVE, Validators.required],
      priorite: [PrioriteIntervention.NORMALE, Validators.required],
      datePlanifiee: [''],
      contratId: ['', Validators.required],
      imprimanteId: [''],
      // Le demandeur sera automatiquement le client du contrat sélectionné
      demandeurId: [''],
      // Le technicien est l'utilisateur connecté qui crée le ticket
      technicienId: [this.authService.getCurrentUserId(), Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadContrats();
    this.setupContratChange();
  }

  private loadContrats(): void {
    // Récupérer tous les contrats - les données client sont déjà incluses dans la réponse
    this.contratService.getAll().subscribe({
      next: (contrats: any[]) => {
        console.log('Contrats récupérés:', contrats.length);
        this.processContrats(contrats);
      },
      error: (error: any) => {
        console.error('Erreur lors du chargement des contrats:', error);
      }
    });
  }

  private processContrats(contrats: any[]): void {
    // Filtrer seulement les contrats actifs ET qui ont un client
    this.contrats = contrats.filter(contrat => {
      const isActif = contrat.statutContrat === 'ACTIF';
      const hasClient = contrat.client !== null;
      return isActif && hasClient;
    });
    
    // Ajouter le clientId pour faciliter l'utilisation si ce n'est pas déjà fait
    this.contrats = this.contrats.map(contrat => {
      if (contrat.client && !contrat.clientId) {
        contrat.clientId = contrat.client.id;
      }
      return contrat;
    });
    
    this.contratsFiltered = [...this.contrats];
    console.log('Contrats actifs avec client disponibles:', this.contratsFiltered.length);
  }

  // Méthode pour filtrer les contrats selon le terme de recherche
  filterContrats(): void {
    if (!this.contratSearchTerm.trim()) {
      this.contratsFiltered = [...this.contrats];
    } else {
      const term = this.contratSearchTerm.toLowerCase();
      this.contratsFiltered = this.contrats.filter(contrat => {
        const numeroContrat = contrat.numeroContrat?.toLowerCase() || '';
        const clientNom = contrat.client?.nom?.toLowerCase() || '';
        const clientPrenom = contrat.client?.prenom?.toLowerCase() || '';
        const clientEmail = contrat.client?.email?.toLowerCase() || '';
        
        return numeroContrat.includes(term) ||
               clientNom.includes(term) ||
               clientPrenom.includes(term) ||
               clientEmail.includes(term);
      });
    }
  }

  // Sélectionner un contrat et mettre à jour le demandeur
  selectContrat(contrat: any): void {
    this.selectedContrat = contrat;
    
    // Le client est déjà présent dans le contrat
    const clientId = contrat.client?.id || contrat.clientId;
    
    this.ticketForm.patchValue({
      contratId: contrat.id,
      demandeurId: clientId
    });
    
    this.showContratTable = false;
    this.loadImprimantesContrat(contrat.id);
  }

  // Afficher/masquer le tableau de sélection des contrats
  toggleContratTable(): void {
    this.showContratTable = !this.showContratTable;
    if (this.showContratTable) {
      this.filterContrats();
    }
  }

  // Réinitialiser la sélection du contrat
  clearContratSelection(): void {
    this.selectedContrat = null;
    this.showContratTable = false;
    this.ticketForm.patchValue({
      contratId: '',
      demandeurId: '',
      imprimanteId: ''
    });
    this.imprimantes = [];
  }

  private setupContratChange(): void {
    // Plus besoin de cette méthode car la sélection se fait via selectContrat()
  }

  private loadImprimantesContrat(contratId: number): void {
    // Supposons qu'il y a une méthode pour obtenir les imprimantes d'un contrat
    // this.contratService.getImprimantes(contratId).subscribe({
    //   next: (imprimantes) => {
    //     this.imprimantes = imprimantes;
    //   },
    //   error: (error) => {
    //     console.error('Erreur lors du chargement des imprimantes:', error);
    //   }
    // });
    
    // Pour l'instant, simulation
    this.imprimantes = [
      { id: 1, modele: 'HP LaserJet Pro 400' },
      { id: 2, modele: 'Canon ImageRunner 2520' },
      { id: 3, modele: 'Xerox WorkCentre 3335' }
    ];
  }

  onSubmit(): void {
    if (this.ticketForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      
      const formValue = this.ticketForm.value;
      const intervention: InterventionCreateDTO = {
        titre: formValue.titre,
        description: formValue.description,
        type: formValue.type,
        priorite: formValue.priorite,
        contratId: formValue.contratId,
        demandeurId: formValue.demandeurId, // Client du contrat
        technicienId: formValue.technicienId, // Utilisateur connecté
        ...(formValue.datePlanifiee && { datePlanifiee: new Date(formValue.datePlanifiee) }),
        ...(formValue.imprimanteId && { imprimanteId: formValue.imprimanteId })
      };

      this.interventionService.creerTicket(intervention).subscribe({
        next: (response) => {
          console.log('Ticket créé avec succès:', response);
          this.router.navigate(['/tickets', response.id]);
        },
        error: (error) => {
          console.error('Erreur lors de la création du ticket:', error);
          this.isSubmitting = false;
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.ticketForm.controls).forEach(key => {
      const control = this.ticketForm.get(key);
      control?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.ticketForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.ticketForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) {
        return `Le champ ${fieldName} est obligatoire`;
      }
      if (field.errors['minlength']) {
        return `Le champ ${fieldName} doit contenir au moins ${field.errors['minlength'].requiredLength} caractères`;
      }
    }
    return '';
  }

  cancel(): void {
    this.router.navigate(['/tickets']);
  }
}
