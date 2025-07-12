import { Component, OnInit } from '@angular/core';
import { InterventionService, InterventionDTO, TypeIntervention, PrioriteIntervention, StatutIntervention } from '../service/intervention.service';
import { ContratService, Contrat } from '../service/contrat.service';
import { ImprimanteService, Imprimante } from '../service/imprimante.service';
import { ClientService, Client } from '../service/client.service';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { formatDate } from '@angular/common';

interface DashboardMetric {
  title: string;
  value: number;
  icon: string;
  color: string;
  trend?: number;
  trendLabel?: string;
  trendUp?: boolean;
}

interface ChartData {
  labels: string[];
  datasets: any[];
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  // Loading and error states
  loading = true;
  error: string | null = null;
  
  // Current date for the dashboard header
  currentDate: Date = new Date();
  
  // For 3D effect animation
  animate3dEffect = true;
  
  // Metrics
  metrics: DashboardMetric[] = [];
  
  // Charts data
  interventionsByTypeData: ChartData = { labels: [], datasets: [] };
  interventionsByStatusData: ChartData = { labels: [], datasets: [] };
  interventionsTrendData: ChartData = { labels: [], datasets: [] };
  
  // Recent activities
  recentInterventions: InterventionDTO[] = [];
  
  // Summary data
  expiringContracts: Contrat[] = [];
  activePrinters: Imprimante[] = [];
  topClients: any[] = [];
  
  // Date filters
  startDate: Date = new Date();
  endDate: Date = new Date();
  
  // Printer statistics
  printerStats = {
    maintenance: 0,
    error: 0,
    healthy: 0,
    topModels: [] as {model: string, count: number}[]
  };
  
  constructor(
    private interventionService: InterventionService,
    private contratService: ContratService,
    private imprimanteService: ImprimanteService,
    private clientService: ClientService
  ) {
    // Set default date range to last 30 days
    this.startDate = new Date();
    this.startDate.setDate(this.startDate.getDate() - 30);
  }

  ngOnInit(): void {
    this.loadDashboardData();
    this.initAnimation();
  }
  
  // Initialize 3D parallax effect
  initAnimation(): void {
    if (this.animate3dEffect) {
      // Only run the effect on desktops to prevent performance issues on mobile
      if (window.innerWidth > 992) {
        document.addEventListener('mousemove', (e) => {
          const cards = document.querySelectorAll('.metric-card, .chart-card, .activity-card');
          const mouseX = e.clientX / window.innerWidth - 0.5;
          const mouseY = e.clientY / window.innerHeight - 0.5;
          
          cards.forEach((cardElement) => {
            const card = cardElement as HTMLElement;
            const rect = card.getBoundingClientRect();
            const cardCenterX = rect.left + rect.width / 2;
            const cardCenterY = rect.top + rect.height / 2;
            
            // Calculate distance from mouse to card center (normalized)
            const distX = (e.clientX - cardCenterX) / (window.innerWidth / 2) * 0.5;
            const distY = (e.clientY - cardCenterY) / (window.innerHeight / 2) * 0.5;
            
            // Apply subtle rotation - more pronounced for closer cards
            const rotateY = distX * 2; // degrees
            const rotateX = -distY * 2; // degrees
            
            // Apply transform with perspective for 3D effect
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1, 1, 1.05)`;
          });
        });
        
        // Reset transforms when mouse leaves the window
        document.addEventListener('mouseleave', () => {
          const cards = document.querySelectorAll('.metric-card, .chart-card, .activity-card');
          cards.forEach((cardElement) => {
            const card = cardElement as HTMLElement;
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
          });
        });
      }
    }
  }
  
  loadDashboardData(): void {
    this.loading = true;
    this.error = null;
    
    // Format dates for API calls
    const startDateStr = formatDate(this.startDate, 'yyyy-MM-dd', 'en');
    const endDateStr = formatDate(this.endDate, 'yyyy-MM-dd', 'en');
    
    // Make parallel API calls to fetch all necessary data
    const interventions$ = this.interventionService.obtenirTickets(
      undefined, // statut
      undefined, // type
      undefined, // priorite
      undefined, // technicienId
      undefined, // demandeurId
      undefined, // contratId
      undefined, // dateDebut
      undefined, // dateFin
      0, // page
      1000 // size
    ).pipe(
      catchError(error => {
        this.error = `Failed to load interventions: ${error.message}`;
        return of({ content: [], totalElements: 0, totalPages: 0, size: 0, number: 0, first: true, last: true });
      })
    );
    
    const contracts$ = this.contratService.getAll().pipe(
      catchError(error => {
        this.error = `Failed to load contracts: ${error.message}`;
        return of([]);
      })
    );
    
    const clients$ = this.clientService.getAllClients().pipe(
      catchError(error => {
        this.error = `Failed to load clients: ${error.message}`;
        return of([]);
      })
    );
    
    // Execute all API calls in parallel
    forkJoin({
      interventions: interventions$,
      contracts: contracts$,
      clients: clients$
    }).subscribe(results => {
      // Process the data once everything is loaded
      this.processInterventionData(results.interventions.content);
      this.processContractData(results.contracts);
      this.processClientData(results.clients, results.interventions.content);
      
      this.loading = false;
    });
  }
  
  processInterventionData(interventions: InterventionDTO[]): void {
    if (!interventions || interventions.length === 0) {
      return;
    }
    
    // Calculate metrics
    const total = interventions.length;
    const pending = interventions.filter(i => i.statut === StatutIntervention.EN_ATTENTE).length;
    const scheduled = interventions.filter(i => i.statut === StatutIntervention.PLANIFIEE).length;
    const inProgress = interventions.filter(i => i.statut === StatutIntervention.EN_COURS).length;
    const completed = interventions.filter(i => i.statut === StatutIntervention.TERMINEE).length;
    
    // Calculate trends (compare with previous 30-day period)
    // In a real app, you'd fetch historical data from the API
    const previousMonthCompleted = Math.round(completed * 0.8); // Simulating previous month's data
    const completionTrend = previousMonthCompleted > 0 ? 
      Math.round((completed - previousMonthCompleted) / previousMonthCompleted * 100) : 0;
    
    // Set up metrics cards
    this.metrics = [
      {
        title: 'Total des interventions',
        value: total,
        icon: 'tools',
        color: 'blue',
        trend: 0,
        trendLabel: 'ce mois-ci'
      },
      {
        title: 'En attente',
        value: pending,
        icon: 'hourglass-split',
        color: 'orange',
        trend: Math.round(pending / total * 100),
        trendLabel: 'du total'
      },
      {
        title: 'Planifiées',
        value: scheduled,
        icon: 'calendar-check',
        color: 'purple',
        trend: Math.round(scheduled / total * 100),
        trendLabel: 'du total'
      },
      {
        title: 'Complétées',
        value: completed,
        icon: 'check-circle',
        color: 'green',
        trend: completionTrend,
        trendLabel: 'vs mois précédent',
        trendUp: completionTrend > 0
      }
    ];
    
    // Process chart data for interventions by type
    const typeCount: Record<string, number> = {};
    const statusCount: Record<string, number> = {};
    
    interventions.forEach(intervention => {
      // Count by type
      const type = intervention.type || 'UNKNOWN';
      typeCount[type] = (typeCount[type] || 0) + 1;
      
      // Count by status
      const status = intervention.statut || 'UNKNOWN';
      statusCount[status] = (statusCount[status] || 0) + 1;
    });
    
    // Prepare chart data for interventions by type
    this.interventionsByTypeData = {
      labels: Object.keys(typeCount).map(type => this.interventionService.getTypeLabel(type as TypeIntervention)),
      datasets: [{
        data: Object.values(typeCount),
        backgroundColor: [
          '#4285F4', // Blue
          '#EA4335', // Red
          '#FBBC05', // Yellow
          '#34A853', // Green
          '#8E24AA', // Purple
          '#F06292'  // Pink
        ]
      }]
    };
    
    // Prepare chart data for interventions by status
    this.interventionsByStatusData = {
      labels: Object.keys(statusCount).map(status => this.formatStatus(status)),
      datasets: [{
        data: Object.values(statusCount),
        backgroundColor: [
          '#FFA726', // Orange
          '#42A5F5', // Blue
          '#66BB6A', // Green
          '#EF5350', // Red
          '#AB47BC', // Purple
          '#78909C', // Blue Grey
          '#FFD54F'  // Amber
        ]
      }]
    };
    
    // Create monthly trend data (for a line chart)
    // Group interventions by month
    const monthlyData: Record<string, number> = {};
    const last6Months = this.getLast6MonthsLabels();
    
    last6Months.forEach(month => {
      monthlyData[month] = 0;
    });
    
    interventions.forEach(intervention => {
      if (intervention.dateCreation) {
        const date = new Date(intervention.dateCreation);
        const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
        
        if (monthlyData[monthYear] !== undefined) {
          monthlyData[monthYear]++;
        }
      }
    });
    
    // Prepare trend chart data
    this.interventionsTrendData = {
      labels: last6Months,
      datasets: [{
        label: 'Interventions',
        data: last6Months.map(month => monthlyData[month] || 0),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        pointBackgroundColor: '#ffffff',
        pointBorderColor: '#3b82f6',
        pointBorderWidth: 2,
        pointRadius: 4,
        tension: 0.3,
        fill: true
      }]
    };
    
    // Get recent interventions (last 5)
    this.recentInterventions = [...interventions]
      .sort((a, b) => {
        const dateA = a.dateCreation ? new Date(a.dateCreation).getTime() : 0;
        const dateB = b.dateCreation ? new Date(b.dateCreation).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 5);
  }
  
  processContractData(contracts: Contrat[]): void {
    if (!contracts || contracts.length === 0) {
      return;
    }
    
    const today = new Date();
    const in30Days = new Date();
    in30Days.setDate(today.getDate() + 30);
    
    // Find contracts expiring in the next 30 days
    this.expiringContracts = contracts.filter(contract => {
      if (!contract.dateFin) {
        return false;
      }
      
      const expirationDate = new Date(contract.dateFin);
      return expirationDate >= today && expirationDate <= in30Days;
    })
    .sort((a, b) => {
      const dateA = a.dateFin ? new Date(a.dateFin).getTime() : 0;
      const dateB = b.dateFin ? new Date(b.dateFin).getTime() : 0;
      return dateA - dateB;
    })
    .slice(0, 5);
    
    // Fetch printers for all active contracts
    const activeContracts = contracts.filter(contract => {
      if (!contract.dateDebut || !contract.dateFin || !contract.id) {
        return false;
      }
      
      const startDate = new Date(contract.dateDebut);
      const endDate = new Date(contract.dateFin);
      return startDate <= today && endDate >= today;
    });
    
    // Get all printers from active contracts
    if (activeContracts.length > 0) {
      const printerObservables: Observable<Imprimante[]>[] = activeContracts
        .filter(contract => contract.id !== undefined)
        .map(contract => this.imprimanteService.getAllByContrat(contract.id!));
      
      forkJoin(printerObservables).subscribe(printerArrays => {
        // Flatten the array of arrays
        this.activePrinters = printerArrays.flat();
        this.calculatePrinterStatistics();
      });
    }
  }
  
  processClientData(clients: Client[], interventions: InterventionDTO[]): void {
    if (!clients || clients.length === 0 || !interventions || interventions.length === 0) {
      return;
    }
    
    // Count interventions per client
    const clientInterventions: Record<number, number> = {};
    
    interventions.forEach(intervention => {
      if (intervention.demandeurId) {
        clientInterventions[intervention.demandeurId] = 
          (clientInterventions[intervention.demandeurId] || 0) + 1;
      }
    });
    
    // Map counts to client data and sort
    this.topClients = Object.entries(clientInterventions)
      .map(([clientId, count]) => {
        const client = clients.find(c => c.id === parseInt(clientId, 10));
        return {
          id: parseInt(clientId, 10),
          nom: client ? `${client.prenom} ${client.nom}` : 'Unknown',
          email: client?.email || '',
          count: count
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }
  
  // Helper methods
  getLast6MonthsLabels(): string[] {
    const labels = [];
    const today = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(today.getMonth() - i);
      labels.push(`${d.getMonth() + 1}/${d.getFullYear()}`);
    }
    
    return labels;
  }
  
  formatStatus(status: string): string {
    const statusMapping: Record<string, string> = {
      'EN_ATTENTE': 'En attente',
      'PLANIFIEE': 'Planifiée',
      'EN_COURS': 'En cours',
      'EN_PAUSE': 'En pause',
      'TERMINEE': 'Terminée',
      'ANNULEE': 'Annulée',
      'REPORTEE': 'Reportée',
      'REJETEE': 'Rejetée',
      'ATTENTE_PIECES': 'Attente pièces',
      'ATTENTE_CLIENT': 'Attente client'
    };
    return statusMapping[status] || status;
  }
  
  formatDate(date: string | Date | undefined): string {
    if (!date) {
      return 'N/A';
    }
    return new Date(date).toLocaleDateString();
  }
  
  getStatusBadgeClass(status: string | undefined): string {
    if (!status) {
      return 'badge bg-secondary';
    }
    
    const classMap: Record<string, string> = {
      'EN_ATTENTE': 'badge bg-warning text-dark',
      'PLANIFIEE': 'badge bg-info text-dark',
      'EN_COURS': 'badge bg-primary',
      'EN_PAUSE': 'badge bg-warning text-dark',
      'TERMINEE': 'badge bg-success',
      'ANNULEE': 'badge bg-danger',
      'REPORTEE': 'badge bg-secondary',
      'REJETEE': 'badge bg-danger',
      'ATTENTE_PIECES': 'badge bg-warning text-dark',
      'ATTENTE_CLIENT': 'badge bg-warning text-dark'
    };
    
    return classMap[status] || 'badge bg-secondary';
  }
  
  getPriorityBadgeClass(priority: string | undefined): string {
    if (!priority) {
      return 'badge bg-secondary';
    }
    
    const classMap: Record<string, string> = {
      'BASSE': 'badge bg-success',
      'NORMALE': 'badge bg-info',
      'HAUTE': 'badge bg-warning text-dark',
      'CRITIQUE': 'badge bg-danger'
    };
    
    return classMap[priority] || 'badge bg-secondary';
  }
  
  refreshData(): void {
    this.loadDashboardData();
  }
  
  // Calculate printer statistics for dashboard display
  calculatePrinterStatistics(): void {
    if (!this.activePrinters || this.activePrinters.length === 0) {
      return;
    }
    
    // For demonstration purposes, we'll assign printers to different states
    // In a real app, this would use actual printer status data from the backend
    
    // Reset statistics
    this.printerStats.maintenance = 0;
    this.printerStats.error = 0;
    this.printerStats.healthy = 0;
    
    // Simulate printer status based on some criteria
    // This should be replaced with actual status data in a real application
    this.activePrinters.forEach((printer, index) => {
      const modulo = index % 5;
      if (modulo === 0) {
        this.printerStats.maintenance++;
      } else if (modulo === 1) {
        this.printerStats.error++;
      } else {
        this.printerStats.healthy++;
      }
    });
    
    // Calculate top printer models
    const modelCount: Record<string, number> = {};
    this.activePrinters.forEach(printer => {
      const modelKey = `${printer.marque} ${printer.modele}`;
      modelCount[modelKey] = (modelCount[modelKey] || 0) + 1;
    });
    
    // Convert to array and sort by count (descending)
    this.printerStats.topModels = Object.entries(modelCount)
      .map(([model, count]) => ({ model, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }
  
  // Methods for accessing printer statistics
  getMaintPrintersCount(): number {
    return this.printerStats.maintenance;
  }
  
  getErrorPrintersCount(): number {
    return this.printerStats.error;
  }
  
  getHealthyPrintersCount(): number {
    return this.printerStats.healthy;
  }
  
  getTopPrinterModels(): {model: string, count: number}[] {
    return this.printerStats.topModels;
  }
}
