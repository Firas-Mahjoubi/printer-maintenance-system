import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { InterventionService } from '../../service/intervention.service';
import { AuthService } from '../../service/auth.service';

@Component({
  selector: 'app-solution-technique',
  templateUrl: './solution-technique.component.html',
  styleUrls: ['./solution-technique.component.css']
})
export class SolutionTechniqueComponent implements OnInit {
  
  solutionForm!: FormGroup;
  interventionId!: number;
  technicienId!: number;
  intervention: any;
  loading = false;
  submitting = false;
  
  // Solutions fréquentes pour les imprimantes
  solutionsFrequentes = [
    'Remplacement de la cartouche de toner',
    'Remplacement du tambour d\'imagerie',
    'Mise à jour du firmware',
    'Remplacement de l\'unité de fusion',
    'Nettoyage des rouleaux d\'entraînement',
    'Réinitialisation des paramètres d\'usine',
    'Recalibration des couleurs',
    'Mise à jour du pilote d\'impression',
    'Remplacement du capteur défectueux',
    'Réparation du circuit d\'alimentation',
    'Nettoyage de la tête d\'impression',
    'Remplacement de la carte mère',
    'Remplacement du module laser'
  ];
  
  // Coûts typiques pour les interventions d'imprimante
  coutTypiques = [
    { label: 'Remplacement de consommables', prix: 80 },
    { label: 'Pièces mécaniques standard', prix: 120 },
    { label: 'Composants électroniques', prix: 150 },
    { label: 'Main d\'œuvre (1h)', prix: 65 },
    { label: 'Main d\'œuvre (2h)', prix: 120 },
    { label: 'Déplacement', prix: 45 },
    { label: 'Remplacement carte électronique', prix: 220 },
    { label: 'Remplacement moteur', prix: 180 }
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private interventionService: InterventionService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.solutionForm = this.fb.group({
      solutionTechnique: ['', [Validators.required, Validators.minLength(10)]],
      coutIntervention: ['', [Validators.required, Validators.min(0)]],
      commentaireInterne: ['']
    });
    
    this.loading = true;
    this.route.params.subscribe(params => {
      this.interventionId = +params['id'];
      
      // Récupérer l'ID du technicien connecté
      this.technicienId = this.authService.getCurrentUserId() || 0;
      
      this.loadIntervention();
    });
  }
  
  loadIntervention() {
    this.interventionService.getInterventionById(this.interventionId).subscribe(
      data => {
        this.intervention = data;
        
        // Pré-remplir le formulaire avec les données existantes (si disponibles)
        if (this.intervention.solution) {
          this.solutionForm.patchValue({
            solutionTechnique: this.intervention.solution
          });
        }
        
        if (this.intervention.coutIntervention) {
          this.solutionForm.patchValue({
            coutIntervention: this.intervention.coutIntervention
          });
        }
        
        if (this.intervention.commentaireInterne) {
          this.solutionForm.patchValue({
            commentaireInterne: this.intervention.commentaireInterne
          });
        }
        
        this.loading = false;
      },
      error => {
        console.error('Erreur lors du chargement de l\'intervention', error);
        this.loading = false;
      }
    );
  }
  
  addSolution(solution: string) {
    const currentValue = this.solutionForm.get('solutionTechnique')?.value || '';
    const newValue = currentValue ? `${currentValue}\n- ${solution}` : `- ${solution}`;
    this.solutionForm.patchValue({
      solutionTechnique: newValue
    });
  }
  
  applyCout(cout: number) {
    this.solutionForm.patchValue({
      coutIntervention: cout
    });
  }
  
  onSubmit() {
    if (this.solutionForm.invalid) {
      return;
    }
    
    // Vérifier les permissions
    if (!this.isAdminOrAssignedTechnician()) {
      console.error('Vous n\'avez pas les droits pour ajouter une solution');
      return;
    }
    
    this.submitting = true;
    const formValues = this.solutionForm.value;
    
    // Get the proper technician ID
    const currentUser = this.authService.getCurrentUser();
    let effectiveTechnicienId = this.technicienId;
    
    // If admin and not the assigned technician, use the assigned technician's ID
    if (currentUser?.role === 'ADMIN' && this.intervention?.technicienId && 
        currentUser.id !== this.intervention.technicienId) {
      effectiveTechnicienId = this.intervention.technicienId;
    }
    
    this.interventionService.enregistrerSolution(
      this.interventionId,
      effectiveTechnicienId,
      formValues.solutionTechnique,
      formValues.coutIntervention,
      formValues.commentaireInterne
    ).subscribe(
      response => {
        console.log('Solution enregistrée avec succès');
        this.submitting = false;
        
        // Rediriger vers la page de détails de l'intervention
        this.router.navigate(['/tickets', this.interventionId]);
      },
      error => {
        console.error('Erreur lors de l\'enregistrement de la solution', error);
        if (error.status === 403) {
          alert('Vous n\'avez pas les permissions nécessaires pour ajouter une solution. Seul le technicien assigné peut effectuer cette action.');
        }
        this.submitting = false;
      }
    );
  }
  
  // Check if current user is admin or the assigned technician
  isAdminOrAssignedTechnician(): boolean {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || !this.intervention) return false;

    // Admin can always perform operations
    if (currentUser.role === 'ADMIN') return true;

    // Check if current user is the assigned technician
    const currentUserId = this.authService.getCurrentUserId();
    return currentUser.role === 'TECHNICIEN' && 
           this.intervention.technicienId !== undefined && 
           this.intervention.technicienId === currentUserId;
  }
}
