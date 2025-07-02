import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../service/auth.service';
import { InterventionService, InterventionCreateDTO, TypeIntervention, PrioriteIntervention } from '../service/intervention.service';
import { ContratService, Contrat } from '../service/contrat.service';
import { ImprimanteService, Imprimante } from '../service/imprimante.service';

@Component({
  selector: 'app-client-new-request',
  templateUrl: './client-new-request.component.html',
  styleUrls: ['./client-new-request.component.css']
})
export class ClientNewRequestComponent implements OnInit {
  requestData: any = {
    equipmentId: '',
    issueType: '',
    priority: '',
    title: '',
    description: '',
    preferredDate: '',
    contactPhone: ''
  };

  equipmentList: Imprimante[] = [];
  attachedFiles: File[] = [];
  isSubmitting: boolean = false;
  minDate: string = '';
  loading: boolean = true;
  error: string | null = null;
  currentUser: any;
  userContracts: Contrat[] = [];
  equipmentContractMap: Map<number, number> = new Map(); // Maps equipment ID to contract ID

  constructor(
    private router: Router,
    private authService: AuthService,
    private interventionService: InterventionService,
    private contratService: ContratService,
    private imprimanteService: ImprimanteService
  ) { }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    
    // Check if user is authenticated and is a client
    if (!this.authService.isLoggedIn() || this.authService.getCurrentUserRole() !== 'CLIENT') {
      this.router.navigate(['/login']);
      return;
    }

    this.setMinDate();
    this.loadUserEquipment();
  }

  public loadUserEquipment(): void {
    this.loading = true;
    this.error = null;

    const currentUserId = this.authService.getCurrentUserId();
    if (!currentUserId) {
      this.error = 'Impossible de récupérer les informations utilisateur';
      this.loading = false;
      return;
    }

    // Get all contracts and filter by current client ID
    this.contratService.getAll().subscribe({
      next: (allContracts) => {
        // Filter contracts that belong to the current client
        const clientContracts = allContracts.filter(contrat => 
          contrat.clientId === currentUserId || 
          contrat.client?.id === currentUserId
        );
        
        this.userContracts = clientContracts;
        
        if (clientContracts.length === 0) {
          this.loading = false;
          this.error = 'Aucun contrat trouvé pour votre compte. Contactez votre administrateur.';
          return;
        }

        // Load equipment from all client's contracts
        this.loadEquipmentFromContracts(clientContracts);
      },
      error: (error) => {
        console.error('Error loading contracts:', error);
        this.loading = false;
        this.error = 'Erreur lors du chargement des contrats';
      }
    });
  }

  private loadEquipmentFromContracts(contracts: Contrat[]): void {
    // Reset equipment list and mapping
    this.equipmentList = [];
    this.equipmentContractMap.clear();
    let completedRequests = 0;
    let hasError = false;

    if (contracts.length === 0) {
      this.loading = false;
      this.error = 'Aucun contrat disponible.';
      return;
    }

    // Load equipment from each contract
    contracts.forEach(contrat => {
      if (!contrat.id) {
        completedRequests++;
        if (completedRequests === contracts.length) {
          this.handleEquipmentLoadingComplete(hasError);
        }
        return;
      }

      this.imprimanteService.getAllByContrat(contrat.id).subscribe({
        next: (printers) => {
          // Add printers from this contract to the equipment list
          printers.forEach(printer => {
            this.equipmentList.push(printer);
            // Map each equipment to its contract
            this.equipmentContractMap.set(printer.id, contrat.id!);
          });
          
          completedRequests++;
          
          if (completedRequests === contracts.length) {
            this.handleEquipmentLoadingComplete(hasError);
          }
        },
        error: (error) => {
          console.error(`Error loading equipment for contract ${contrat.id}:`, error);
          hasError = true;
          completedRequests++;
          
          if (completedRequests === contracts.length) {
            this.handleEquipmentLoadingComplete(hasError);
          }
        }
      });
    });
  }

  private handleEquipmentLoadingComplete(hasError: boolean): void {
    this.loading = false;
    
    if (hasError) {
      this.error = 'Erreur lors du chargement de certains équipements';
    } else if (this.equipmentList.length === 0) {
      this.error = 'Aucun équipement trouvé dans vos contrats.';
    } else {
      this.error = null;
    }
  }

  setMinDate(): void {
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];
  }

  onFileSelected(event: any): void {
    const files = Array.from(event.target.files) as File[];
    
    files.forEach(file => {
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert(`Le fichier ${file.name} est trop volumineux (max 5MB)`);
        return;
      }
      
      // Check file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        alert(`Le type de fichier ${file.name} n'est pas autorisé`);
        return;
      }
      
      this.attachedFiles.push(file);
    });
    
    // Clear the input
    event.target.value = '';
  }

  removeFile(index: number): void {
    this.attachedFiles.splice(index, 1);
  }

  getFileIcon(fileType: string): string {
    if (fileType.includes('image')) {
      return 'fa-image';
    } else if (fileType.includes('pdf')) {
      return 'fa-file-pdf';
    }
    return 'fa-file';
  }

  submitRequest(): void {
    if (this.isSubmitting) return;
    
    this.isSubmitting = true;
    this.error = null;

    try {
      // Find the contract that contains the selected equipment
      const selectedEquipmentId = parseInt(this.requestData.equipmentId);
      const contractId = this.findContractForEquipment(selectedEquipmentId);
      
      if (!contractId) {
        this.isSubmitting = false;
        this.error = 'Impossible de déterminer le contrat pour cet équipement.';
        return;
      }

      // Map form data to backend DTO
      const interventionData: InterventionCreateDTO = {
        titre: this.requestData.title,
        description: this.requestData.description,
        type: this.mapIssueTypeToInterventionType(this.requestData.issueType),
        priorite: this.mapPriorityToPrioriteIntervention(this.requestData.priority),
        datePlanifiee: this.requestData.preferredDate ? new Date(this.requestData.preferredDate) : undefined,
        contratId: contractId,
        imprimanteId: selectedEquipmentId,
        demandeurId: this.authService.getCurrentUserId()!
      };

      // Submit the intervention request
      this.interventionService.creerTicket(interventionData).subscribe({
        next: (response) => {
          console.log('Ticket created successfully:', response);
          this.isSubmitting = false;
          
          // Show success message and redirect
          alert(`Votre demande a été créée avec succès ! Numéro de ticket: ${response.numero || response.id}`);
          this.router.navigate(['/client-requests']);
        },
        error: (error) => {
          console.error('Error creating ticket:', error);
          this.isSubmitting = false;
          this.error = 'Erreur lors de la création de la demande. Veuillez réessayer.';
          
          // Show error alert
          alert('Erreur lors de l\'envoi de la demande. Veuillez réessayer.');
        }
      });
      
    } catch (error) {
      console.error('Error preparing request data:', error);
      this.isSubmitting = false;
      this.error = 'Erreur lors de la préparation des données.';
      alert('Erreur lors de la préparation de la demande.');
    }
  }

  private findContractForEquipment(equipmentId: number): number | null {
    // Use the equipment-contract mapping we built when loading equipment
    return this.equipmentContractMap.get(equipmentId) || null;
  }

  private mapIssueTypeToInterventionType(issueType: string): TypeIntervention {
    const typeMapping: { [key: string]: TypeIntervention } = {
      'jam': TypeIntervention.CORRECTIVE,
      'quality': TypeIntervention.CORRECTIVE,
      'connectivity': TypeIntervention.CORRECTIVE,
      'cartridge': TypeIntervention.MAINTENANCE,
      'mechanical': TypeIntervention.CORRECTIVE,
      'software': TypeIntervention.CORRECTIVE,
      'maintenance': TypeIntervention.PREVENTIVE,
      'other': TypeIntervention.CORRECTIVE
    };
    
    return typeMapping[issueType] || TypeIntervention.CORRECTIVE;
  }

  private mapPriorityToPrioriteIntervention(priority: string): PrioriteIntervention {
    const priorityMapping: { [key: string]: PrioriteIntervention } = {
      'low': PrioriteIntervention.BASSE,
      'medium': PrioriteIntervention.NORMALE,
      'high': PrioriteIntervention.HAUTE,
      'urgent': PrioriteIntervention.CRITIQUE
    };
    
    return priorityMapping[priority] || PrioriteIntervention.NORMALE;
  }

  goBack(): void {
    if (this.hasUnsavedChanges()) {
      if (confirm('Vous avez des modifications non sauvegardées. Êtes-vous sûr de vouloir quitter ?')) {
        this.router.navigate(['/client-dashboard']);
      }
    } else {
      this.router.navigate(['/client-dashboard']);
    }
  }

  private hasUnsavedChanges(): boolean {
    return !!(this.requestData.title || 
             this.requestData.description || 
             this.requestData.equipmentId || 
             this.requestData.issueType || 
             this.requestData.priority ||
             this.attachedFiles.length > 0);
  }
}
