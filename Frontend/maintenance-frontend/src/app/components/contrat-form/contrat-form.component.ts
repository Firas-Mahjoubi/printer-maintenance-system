import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { ContratService, Contrat, Utilisateur } from '../../service/contrat.service';
import { NgForm } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

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
    clientId: undefined
  };

  clients: Utilisateur[] = [];
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

  onSubmit(form: NgForm): void {
    if (form.valid && this.contrat.clientId) {
      const clientId = this.contrat.clientId!;
      const payload = { ...this.contrat };
      delete payload.clientId;

      this.contratService.create(payload, clientId).subscribe({
        next: () => {
          this.contratCreated.emit();
          form.resetForm();
        },
        error: (err) => console.error('Failed to create contract', err)
      });
    }
  }
}
