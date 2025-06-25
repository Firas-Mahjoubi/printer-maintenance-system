// contrat.component.ts
import { Component, OnInit } from '@angular/core';
import { ContratService , Contrat } from '../../service/contrat.service';

@Component({
  selector: 'app-contrat',
  templateUrl: './contrat.component.html'
})
export class ContratComponent implements OnInit {
  contrats: Contrat[] = [];

  constructor(private contratService: ContratService) {}

  ngOnInit() {
    this.loadContrats();
  }

  loadContrats() {
    this.contratService.getAll().subscribe(data => this.contrats = data);
  }

  deleteContrat(id: number | undefined) {
    if (!id) return;
    if (confirm('Êtes-vous sûr de vouloir supprimer ce contrat ?')) {
      this.contratService.delete(id).subscribe(() => this.loadContrats());
    }
  }

  newContrat() {
    // Implement modal/form or route to create
    alert("Ouvrir formulaire de création");
  }

  editContrat(contrat: Contrat) {
    // Implement modal/form or route to edit
    alert("Ouvrir formulaire d'édition pour: " + contrat.numeroContrat);
  }
}
