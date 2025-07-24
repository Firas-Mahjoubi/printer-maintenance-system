import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { InterventionService } from '../../service/intervention.service';

@Component({
  selector: 'app-satisfaction-client',
  templateUrl: './satisfaction-client.component.html',
  styleUrls: ['./satisfaction-client.component.css']
})
export class SatisfactionClientComponent implements OnInit {
  
  satisfactionForm!: FormGroup;
  interventionId!: number;
  clientId!: number;
  intervention: any;
  loading = false;
  submitting = false;
  
  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private interventionService: InterventionService
  ) { }

  ngOnInit(): void {
    this.satisfactionForm = this.fb.group({
      noteSatisfaction: [null, [Validators.required, Validators.min(1), Validators.max(5)]],
      commentaireSatisfaction: ['']
    });
    
    this.loading = true;
    this.route.params.subscribe(params => {
      this.interventionId = +params['id'];
      
      // Récupérer l'ID du client connecté
      this.clientId = parseInt(localStorage.getItem('userId') || '0');
      
      this.loadIntervention();
    });
  }
  
  loadIntervention() {
    this.interventionService.getInterventionById(this.interventionId).subscribe(
      data => {
        this.intervention = data;
        
        // Pré-remplir le formulaire avec les données existantes (si disponibles)
        if (this.intervention.noteSatisfaction) {
          this.satisfactionForm.patchValue({
            noteSatisfaction: this.intervention.noteSatisfaction
          });
        }
        
        if (this.intervention.commentaireSatisfaction) {
          this.satisfactionForm.patchValue({
            commentaireSatisfaction: this.intervention.commentaireSatisfaction
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
  
  setRating(rating: number) {
    this.satisfactionForm.patchValue({
      noteSatisfaction: rating
    });
  }
  
  onSubmit() {
    if (this.satisfactionForm.invalid) {
      return;
    }
    
    this.submitting = true;
    const formValues = this.satisfactionForm.value;
    
    this.interventionService.enregistrerSatisfaction(
      this.interventionId,
      this.clientId,
      formValues.noteSatisfaction,
      formValues.commentaireSatisfaction
    ).subscribe(
      response => {
        console.log('Satisfaction enregistrée avec succès');
        this.submitting = false;
        
        // Rediriger vers la page de détails de l'intervention
        this.router.navigate(['/client-requests']);
      },
      error => {
        console.error('Erreur lors de l\'enregistrement de la satisfaction', error);
        this.submitting = false;
      }
    );
  }
}
