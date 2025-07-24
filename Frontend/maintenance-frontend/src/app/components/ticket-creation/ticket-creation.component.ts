import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { InterventionService, InterventionCreateDTO, TypeIntervention, PrioriteIntervention } from '../../service/intervention.service';
import { ContratService, Imprimante } from '../../service/contrat.service';
import { ClientService } from '../../service/client.service';
import { AuthService } from '../../service/auth.service';
import { ImprimanteService, ImprimanteStatus } from '../../service/imprimante.service';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';

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
  imprimantes: Imprimante[] = [];
  selectedImprimantes: Imprimante[] = [];
  submitError: string | null = null;
  
  // Variables pour la recherche de contrats
  contratSearchTerm = '';
  showContratTable = false;
  selectedContrat: any = null;
  
  // Mode de création de ticket
  createSingleTicket = true; // true = un ticket pour toutes les imprimantes, false = un ticket par imprimante
  
  typeOptions = [
    { value: TypeIntervention.CORRECTIVE, label: 'Corrective - Réparation suite à panne' },
    { value: TypeIntervention.PREVENTIVE, label: 'Préventive - Maintenance planifiée' },
    { value: TypeIntervention.URGENTE, label: 'Urgente - Intervention prioritaire' },
    { value: TypeIntervention.INSTALLATION, label: 'Installation - Nouveau matériel' },
    { value: TypeIntervention.MISE_A_JOUR, label: 'Mise à jour - Logiciel/firmware' },
    { value: TypeIntervention.DIAGNOSTIC, label: 'Diagnostic - Analyse technique' },
    { value: TypeIntervention.FORMATION, label: 'Formation - Support utilisateur' },
    { value: TypeIntervention.NETTOYAGE, label: 'Nettoyage - Entretien périodique' },
    { value: TypeIntervention.MAINTENANCE, label: 'Maintenance - Entretien régulier' }
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
    private imprimanteService: ImprimanteService,
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
      imprimanteIds: this.fb.array([]),
      // Le demandeur sera automatiquement le client du contrat sélectionné
      demandeurId: [''],
      // Le technicien est l'utilisateur connecté qui crée le ticket
      technicienId: [this.authService.getCurrentUserId(), Validators.required],
      selectAllPrinters: [false]
    });
  }

  ngOnInit(): void {
    this.loadContrats();
  }

  get imprimanteIdsFormArray() {
    return this.ticketForm.get('imprimanteIds') as FormArray;
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
      demandeurId: clientId,
      imprimanteId: '',
      selectAllPrinters: false
    });
    
    // Reset printer selections
    this.imprimanteIdsFormArray.clear();
    this.selectedImprimantes = [];
    
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
      imprimanteId: '',
      selectAllPrinters: false
    });
    this.imprimantes = [];
    this.selectedImprimantes = [];
    this.imprimanteIdsFormArray.clear();
  }

  private loadImprimantesContrat(contratId: number): void {
    // Charger les imprimantes du contrat
    this.contratService.getImprimantesForContract(contratId).subscribe({
      next: (imprimantes) => {
        this.imprimantes = imprimantes;
        console.log(`${imprimantes.length} imprimantes trouvées pour ce contrat`);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des imprimantes:', error);
        this.imprimantes = [];
      }
    });
  }
  
  // Gérer la sélection des imprimantes multiples
  onImprimanteSelectionChange(event: any, imprimanteId: number): void {
    if (event.target.checked) {
      // Ajouter l'imprimante
      this.imprimanteIdsFormArray.push(new FormControl(imprimanteId));
      this.selectedImprimantes.push(this.imprimantes.find(imp => imp.id === imprimanteId)!);
    } else {
      // Retirer l'imprimante
      const index = this.imprimanteIdsFormArray.controls.findIndex(x => x.value === imprimanteId);
      if (index >= 0) {
        this.imprimanteIdsFormArray.removeAt(index);
        this.selectedImprimantes = this.selectedImprimantes.filter(imp => imp.id !== imprimanteId);
      }
      
      // Si le "sélectionner tout" était coché, le décocher
      if (this.ticketForm.get('selectAllPrinters')?.value) {
        this.ticketForm.patchValue({ selectAllPrinters: false });
      }
    }
  }
  
  // Sélectionner/désélectionner toutes les imprimantes
  onSelectAllImprimantesChange(event: any): void {
    const isChecked = event.target.checked;
    
    // Vider le FormArray existant
    this.imprimanteIdsFormArray.clear();
    
    if (isChecked) {
      // Ajouter toutes les imprimantes
      this.imprimantes.forEach(imprimante => {
        this.imprimanteIdsFormArray.push(new FormControl(imprimante.id));
      });
      this.selectedImprimantes = [...this.imprimantes];
    } else {
      // Vider les imprimantes sélectionnées
      this.selectedImprimantes = [];
    }
  }
  
  // Changer le mode de création de ticket (unique vs. multiple)
  toggleTicketCreationMode(): void {
    this.createSingleTicket = !this.createSingleTicket;
  }

  onSubmit(): void {
    if (this.ticketForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      // Clear any previous errors
      this.submitError = null;
      
      const formValue = this.ticketForm.value;
      const selectedImprIds = this.imprimanteIdsFormArray.value;
      
      // Log the form values for debugging
      console.log('Form values:', formValue);
      console.log('Selected type:', formValue.type);
      
      // Création du DTO de base
      const baseIntervention: InterventionCreateDTO = {
        titre: formValue.titre,
        description: formValue.description,
        type: formValue.type,
        priorite: formValue.priorite,
        contratId: formValue.contratId,
        demandeurId: formValue.demandeurId,
        technicienId: formValue.technicienId,
        ...(formValue.datePlanifiee && { datePlanifiee: new Date(formValue.datePlanifiee) })
      };
      
      // Cas 1: Sélection multiple d'imprimantes
      if (selectedImprIds && selectedImprIds.length > 0) {
        if (this.createSingleTicket) {
          // Cas 1a: Un seul ticket pour toutes les imprimantes sélectionnées
          const intervention = {
            ...baseIntervention,
            imprimanteIds: selectedImprIds
          };
          
          this.interventionService.creerTicketMultiImprimantes(intervention).subscribe({
            next: (response) => {
              console.log('Ticket multi-imprimantes créé avec succès:', response);
              
              // Refresh printer statuses after creating tickets
              if (selectedImprIds && selectedImprIds.length > 0) {
                console.log('Refreshing status for selected printers:', selectedImprIds);
                
                // Wait 1 second to ensure backend has time to update statuses
                setTimeout(() => {
                  selectedImprIds.forEach((impId: number) => {
                    this.imprimanteService.refreshPrinterStatus(impId).subscribe({
                      next: (status) => console.log(`Refreshed status for printer ${impId}: ${status}`),
                      error: (err) => console.error(`Error refreshing printer ${impId} status:`, err)
                    });
                  });
                }, 1000);
              }
              
              this.router.navigate(['/tickets', response.id]);
            },
            error: (error) => {
              console.error('Erreur lors de la création du ticket multi-imprimantes:', error);
              this.handleSubmitError(error);
            }
          });
        } else {
          // Cas 1b: Un ticket par imprimante sélectionnée
          const intervention = {
            ...baseIntervention,
            imprimanteIds: selectedImprIds
          };
          
          this.interventionService.creerTicketsParImprimante(intervention).subscribe({
            next: (responses) => {
              console.log(`${responses.length} tickets créés avec succès:`, responses);
              
              // Refresh printer statuses after creating tickets
              if (selectedImprIds && selectedImprIds.length > 0) {
                console.log('Refreshing status for selected printers:', selectedImprIds);
                
                // Wait 1 second to ensure backend has time to update statuses
                setTimeout(() => {
                  selectedImprIds.forEach((impId: number) => {
                    this.imprimanteService.refreshPrinterStatus(impId).subscribe({
                      next: (status) => console.log(`Refreshed status for printer ${impId}: ${status}`),
                      error: (err) => console.error(`Error refreshing printer ${impId} status:`, err)
                    });
                  });
                }, 1000);
              }
              
              // Rediriger vers la liste des tickets
              this.router.navigate(['/tickets']);
            },
            error: (error) => {
              console.error('Erreur lors de la création des tickets par imprimante:', error);
              this.handleSubmitError(error);
            }
          });
        }
      } 
      // Cas 2: Sélection d'une seule imprimante dans la liste déroulante
      else if (formValue.imprimanteId) {
        const intervention = {
          ...baseIntervention,
          imprimanteId: formValue.imprimanteId
        };
        
        this.interventionService.creerTicket(intervention).subscribe({
          next: (response) => {
            console.log('Ticket créé avec succès:', response);
            
            // Refresh printer status after creating ticket
            if (formValue.imprimanteId) {
              console.log('Refreshing status for printer:', formValue.imprimanteId);
              
              // Wait 1 second to ensure backend has time to update status
              setTimeout(() => {
                this.imprimanteService.refreshPrinterStatus(formValue.imprimanteId).subscribe({
                  next: (status) => console.log(`Refreshed status for printer ${formValue.imprimanteId}: ${status}`),
                  error: (err) => console.error(`Error refreshing printer ${formValue.imprimanteId} status:`, err)
                });
              }, 1000);
            }
            
            this.router.navigate(['/tickets', response.id]);
          },
          error: (error) => {
            console.error('Erreur lors de la création du ticket:', error);
            this.handleSubmitError(error);
          }
        });
      } 
      // Cas 3: Aucune imprimante sélectionnée
      else {
        this.interventionService.creerTicket(baseIntervention).subscribe({
          next: (response) => {
            console.log('Ticket sans imprimante créé avec succès:', response);
            this.router.navigate(['/tickets', response.id]);
          },
          error: (error) => {
            console.error('Erreur lors de la création du ticket:', error);
            this.handleSubmitError(error);
          }
        });
      }
    } else {
      this.markFormGroupTouched();
    }
  }
  
  private handleSubmitError(error: any): void {
    this.isSubmitting = false;
    
    // Check if there's a specific error message from the server
    let errorMessage = 'Une erreur est survenue lors de la création du ticket.';
    
    if (error && error.error && error.error.message) {
      errorMessage = error.error.message;
    } else if (error && error.error && typeof error.error === 'string') {
      errorMessage = error.error;
    } else if (error && error.message) {
      errorMessage = error.message;
    }
    
    // Check if it's a validation constraint error
    if (errorMessage.includes('contrainte') || errorMessage.includes('constraint')) {
      if (errorMessage.includes('type_intervention')) {
        errorMessage = 'Le type d\'intervention sélectionné n\'est pas valide. Veuillez en choisir un autre.';
      }
    }
    
    // Set the error message to display in the UI
    this.submitError = errorMessage;
    
    // Scroll to the error message
    setTimeout(() => {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: 'smooth'
      });
    }, 100);
  }

  // Vérifier si une imprimante est sélectionnée
  isImprimanteSelected(imprimanteId: number): boolean {
    return this.imprimanteIdsFormArray.controls.some(control => control.value === imprimanteId);
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
