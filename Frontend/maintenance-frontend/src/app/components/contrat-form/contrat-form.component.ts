import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { ContratService, Contrat, Utilisateur } from '../../service/contrat.service';
import { NgForm } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AngularEditorConfig } from '@kolkov/angular-editor';

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
  isSubmitting: boolean = false;
  today: string = new Date().toISOString().split('T')[0];
  
  @Output() contratCreated = new EventEmitter<void>();

  constructor(private contratService: ContratService, private http: HttpClient) {}

  ngOnInit(): void {
    this.loadClients();
  }

  loadClients() {
    this.http.get<Utilisateur[]>('http://localhost:8081/api/Utilisateur/getAllClients')
      .subscribe({
        next: (data) => this.clients = data,
        error: (err) => console.error('Failed to load clients', err)
      });
  }

  getFormProgress(): number {
    let filledFields = 0;
    const totalFields = 6; // Total required fields

    if (this.contrat.numeroContrat) filledFields++;
    if (this.contrat.statutContrat) filledFields++;
    if (this.contrat.dateDebut) filledFields++;
    if (this.contrat.dateFin) filledFields++;
    if (this.contrat.clientId) filledFields++;
    if (this.contrat.conditions_contrat) filledFields++;

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

  onSubmit(form: NgForm): void {
    if (form.valid && this.contrat.clientId) {
      this.isSubmitting = true;
      const clientId = this.contrat.clientId!;
      const payload = { ...this.contrat };
      delete payload.clientId;

      this.contratService.create(payload, clientId).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.contratCreated.emit();
          form.resetForm();
          // Reset the contrat object
          this.contrat = {
            numeroContrat: '',
            dateDebut: '',
            dateFin: '',
            statutContrat: '',
            clientId: undefined,
            conditions_contrat: ''
          };
        },
        error: (err) => {
          this.isSubmitting = false;
          console.error('Failed to create contract', err);
        }
      });
    }
  }
}
