import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { StatutIntervention } from '../../service/intervention.service';

@Component({
  selector: 'app-ticket-workflow',
  templateUrl: './ticket-workflow.component.html',
  styleUrls: ['./ticket-workflow.component.css']
})
export class TicketWorkflowComponent implements OnInit, OnChanges {
  @Input() status: string = '';
  @Input() diagnostic: string | null = '';
  @Input() solution: string | null = '';
  @Input() note: number | null = null;
  
  // Workflow steps
  steps = [
    { id: 'creation', label: 'Création', icon: 'bi-plus-circle', active: false, completed: false },
    { id: 'assigned', label: 'Assignation', icon: 'bi-person-check', active: false, completed: false },
    { id: 'in_progress', label: 'En cours', icon: 'bi-play-circle', active: false, completed: false },
    { id: 'diagnostic', label: 'Diagnostic', icon: 'bi-stethoscope', active: false, completed: false },
    { id: 'solution', label: 'Solution', icon: 'bi-wrench', active: false, completed: false },
    { id: 'closed', label: 'Clôture', icon: 'bi-check-circle', active: false, completed: false },
    { id: 'feedback', label: 'Satisfaction', icon: 'bi-star', active: false, completed: false }
  ];

  constructor() { }

  ngOnInit(): void {
    this.updateWorkflowStatus();
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['status'] || changes['diagnostic'] || changes['solution'] || changes['note']) {
      this.updateWorkflowStatus();
    }
  }
  
  private updateWorkflowStatus(): void {
    // Reset all steps
    this.steps.forEach(step => {
      step.active = false;
      step.completed = false;
    });
    
    // Update steps based on current status
    switch (this.status) {
      case StatutIntervention.EN_ATTENTE:
        this.setStepStatus('creation', true, true);
        this.setStepStatus('assigned', true, false);
        break;
        
      case StatutIntervention.PLANIFIEE:
        this.setStepStatus('creation', false, true);
        this.setStepStatus('assigned', true, true);
        this.setStepStatus('in_progress', true, false);
        break;
        
      case StatutIntervention.EN_COURS:
        this.setStepStatus('creation', false, true);
        this.setStepStatus('assigned', false, true);
        this.setStepStatus('in_progress', true, true);
        
        // Check diagnostic status
        if (this.diagnostic && this.diagnostic.trim() !== '') {
          this.setStepStatus('diagnostic', false, true);
          this.setStepStatus('solution', true, false);
        } else {
          this.setStepStatus('diagnostic', true, false);
        }
        
        // Check solution status
        if (this.solution && this.solution.trim() !== '') {
          this.setStepStatus('solution', false, true);
          this.setStepStatus('closed', true, false);
        }
        break;
        
      case StatutIntervention.EN_PAUSE:
        this.setStepStatus('creation', false, true);
        this.setStepStatus('assigned', false, true);
        this.setStepStatus('in_progress', true, true);
        
        // Paused state
        if (this.diagnostic && this.diagnostic.trim() !== '') {
          this.setStepStatus('diagnostic', false, true);
        } else {
          this.setStepStatus('diagnostic', true, false);
        }
        break;
        
      case StatutIntervention.TERMINEE:
        this.setStepStatus('creation', false, true);
        this.setStepStatus('assigned', false, true);
        this.setStepStatus('in_progress', false, true);
        this.setStepStatus('diagnostic', false, true);
        this.setStepStatus('solution', false, true);
        this.setStepStatus('closed', this.note === null, true);
        
        // Check satisfaction status
        if (this.note !== null) {
          this.setStepStatus('feedback', true, true);
        } else {
          this.setStepStatus('feedback', true, false);
        }
        break;
        
      case StatutIntervention.ANNULEE:
      case StatutIntervention.REPORTEE:
      case StatutIntervention.REJETEE:
        this.setStepStatus('creation', false, true);
        // For cancelled tickets, we just mark the first step as completed
        break;
    }
  }
  
  private setStepStatus(stepId: string, active: boolean, completed: boolean): void {
    const step = this.steps.find(s => s.id === stepId);
    if (step) {
      step.active = active;
      step.completed = completed;
    }
  }
}
