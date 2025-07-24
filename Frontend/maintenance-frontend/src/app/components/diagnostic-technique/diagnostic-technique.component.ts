import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { InterventionService } from '../../service/intervention.service';
import { AuthService } from '../../service/auth.service';

@Component({
  selector: 'app-diagnostic-technique',
  templateUrl: './diagnostic-technique.component.html',
  styleUrls: ['./diagnostic-technique.component.css']
})
export class DiagnosticTechniqueComponent implements OnInit {
  
  diagnosticForm!: FormGroup;
  interventionId!: number;
  technicienId!: number;
  intervention: any;
  loading = false;
  submitting = false;
  
  // Symptômes courants pour les imprimantes
  symptomesFrequents = [
    'Impression de pages blanches',
    'Papier coincé',
    'Stries ou lignes sur les impressions',
    'Taches sur les impressions',
    'Couleurs incorrectes',
    'Impression trop claire',
    'Impression trop foncée',
    'Message d\'erreur: Toner bas',
    'Message d\'erreur: Bourrage papier',
    'Message d\'erreur: Cartouche non reconnue',
    'Impossible de se connecter à l\'imprimante',
    'Impression lente',
    'Bruit anormal lors de l\'impression'
  ];
  
  // Diagnostics courants pour les imprimantes
  diagnosticsFrequents = [
    'Cartouche de toner défectueuse',
    'Tambour d\'imagerie usé',
    'Unité de fusion endommagée',
    'Rouleau d\'entraînement usé',
    'Problème de calibration des couleurs',
    'Firmware obsolète',
    'Problème de connectivité réseau',
    'Problème de configuration du pilote',
    'Accumulation de toner dans les composants internes',
    'Papier incompatible avec l\'imprimante',
    'Problème d\'alimentation électrique',
    'Capteur défectueux',
    'Carte logique défaillante'
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private interventionService: InterventionService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.diagnosticForm = this.fb.group({
      diagnosticTechnique: ['', [Validators.required, Validators.minLength(10)]],
      symptomesDetailles: ['', [Validators.required, Validators.minLength(10)]]
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
        if (this.intervention.diagnosticTechnique) {
          this.diagnosticForm.patchValue({
            diagnosticTechnique: this.intervention.diagnosticTechnique
          });
        }
        
        if (this.intervention.symptomes) {
          this.diagnosticForm.patchValue({
            symptomesDetailles: this.intervention.symptomes
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
  
  addSymptome(symptome: string) {
    const currentValue = this.diagnosticForm.get('symptomesDetailles')?.value || '';
    const newValue = currentValue ? `${currentValue}\n- ${symptome}` : `- ${symptome}`;
    this.diagnosticForm.patchValue({
      symptomesDetailles: newValue
    });
  }
  
  addDiagnostic(diagnostic: string) {
    const currentValue = this.diagnosticForm.get('diagnosticTechnique')?.value || '';
    const newValue = currentValue ? `${currentValue}\n- ${diagnostic}` : `- ${diagnostic}`;
    this.diagnosticForm.patchValue({
      diagnosticTechnique: newValue
    });
  }
  
  onSubmit() {
    if (this.diagnosticForm.invalid) {
      return;
    }
    
    // Vérifier les permissions
    if (!this.isAdminOrAssignedTechnician()) {
      console.error('Vous n\'avez pas les droits pour ajouter un diagnostic');
      return;
    }
    
    this.submitting = true;
    const formValues = this.diagnosticForm.value;
    
    // Get the proper technician ID
    const currentUser = this.authService.getCurrentUser();
    let effectiveTechnicienId = this.technicienId;
    
    // If admin and not the assigned technician, use the assigned technician's ID
    if (currentUser?.role === 'ADMIN' && this.intervention?.technicienId && 
        currentUser.id !== this.intervention.technicienId) {
      effectiveTechnicienId = this.intervention.technicienId;
    }
    
    this.interventionService.enregistrerDiagnostic(
      this.interventionId,
      effectiveTechnicienId,
      formValues.diagnosticTechnique,
      formValues.symptomesDetailles
    ).subscribe(
      response => {
        console.log('Diagnostic enregistré avec succès');
        this.submitting = false;
        
        // Rediriger vers la page de détails de l'intervention
        this.router.navigate(['/tickets', this.interventionId]);
      },
      error => {
        console.error('Erreur lors de l\'enregistrement du diagnostic', error);
        if (error.status === 403) {
          alert('Vous n\'avez pas les permissions nécessaires pour ajouter un diagnostic. Seul le technicien assigné peut effectuer cette action.');
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
