import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-client-history',
  templateUrl: './client-history.component.html',
  styleUrls: ['./client-history.component.css']
})
export class ClientHistoryComponent implements OnInit {
  historyItems: any[] = [];
  filteredHistory: any[] = [];
  equipmentList: any[] = [];
  
  selectedPeriod: string = '';
  selectedType: string = '';
  selectedEquipment: string = '';
  selectedStatus: string = '';

  // Stats
  totalInterventions: number = 0;
  completedInterventions: number = 0;
  averageResponseTime: number = 0;
  satisfactionRate: number = 0;

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.loadEquipment();
    this.loadHistory();
    this.calculateStats();
    
    // Check if filtering by specific equipment
    this.route.queryParams.subscribe(params => {
      if (params['equipmentId']) {
        this.selectedEquipment = params['equipmentId'];
        this.filterHistory();
      }
    });
  }

  loadEquipment(): void {
    // Mock data - replace with actual service call
    this.equipmentList = [
      { id: '1', name: 'HP LaserJet Pro M404n', location: 'Bureau 201' },
      { id: '2', name: 'Canon Pixma TS3350', location: 'Bureau 105' },
      { id: '3', name: 'Epson EcoTank L3150', location: 'Salle de réunion' },
      { id: '4', name: 'Brother DCP-L2530DW', location: 'Comptabilité' }
    ];
  }

  loadHistory(): void {
    // Mock data - replace with actual service call
    this.historyItems = [
      {
        id: 'INT001',
        title: 'Maintenance préventive trimestrielle',
        description: 'Maintenance préventive complète avec nettoyage, vérification des composants et mise à jour firmware.',
        type: 'maintenance',
        status: 'completed',
        statusLabel: 'Terminé',
        date: new Date('2024-01-15T09:00:00'),
        equipment: 'HP LaserJet Pro M404n - Bureau 201',
        equipmentId: '1',
        details: {
          technician: 'Jean Dupont',
          duration: '2h30',
          parts: ['Tambour d\'impression', 'Rouleau de transfert'],
          actions: [
            'Nettoyage complet de l\'imprimante',
            'Remplacement du tambour d\'impression',
            'Mise à jour du firmware',
            'Calibrage des couleurs',
            'Test d\'impression qualité'
          ]
        },
        cost: {
          total: 185.50,
          breakdown: {
            labor: 120.00,
            parts: 65.50
          }
        },
        rating: 5
      },
      {
        id: 'INT002',
        title: 'Réparation bourrage papier',
        description: 'Intervention suite à des bourrages papier récurrents. Identification et résolution du problème.',
        type: 'repair',
        status: 'completed',
        statusLabel: 'Terminé',
        date: new Date('2024-01-10T14:30:00'),
        equipment: 'Canon Pixma TS3350 - Bureau 105',
        equipmentId: '2',
        details: {
          technician: 'Marie Martin',
          duration: '1h45',
          parts: ['Rouleau d\'entraînement papier'],
          actions: [
            'Diagnostic du mécanisme papier',
            'Nettoyage des rouleaux',
            'Remplacement rouleau défaillant',
            'Test de fonctionnement',
            'Formation utilisateur'
          ]
        },
        cost: {
          total: 95.00,
          breakdown: {
            labor: 70.00,
            parts: 25.00
          }
        },
        rating: 4
      },
      {
        id: 'INT003',
        title: 'Installation nouvel équipement',
        description: 'Installation et configuration de la nouvelle imprimante Epson EcoTank.',
        type: 'installation',
        status: 'completed',
        statusLabel: 'Terminé',
        date: new Date('2023-12-20T10:00:00'),
        equipment: 'Epson EcoTank L3150 - Salle de réunion',
        equipmentId: '3',
        details: {
          technician: 'Pierre Leroy',
          duration: '3h00',
          parts: [],
          actions: [
            'Déballage et installation physique',
            'Configuration réseau WiFi',
            'Installation pilotes sur ordinateurs',
            'Configuration paramètres d\'impression',
            'Formation équipe',
            'Test complet fonctionnalités'
          ]
        },
        cost: {
          total: 150.00,
          breakdown: {
            labor: 150.00,
            parts: 0.00
          }
        },
        rating: 5
      },
      {
        id: 'INT004',
        title: 'Remplacement cartouches',
        description: 'Remplacement des cartouches d\'encre et vérification qualité d\'impression.',
        type: 'replacement',
        status: 'completed',
        statusLabel: 'Terminé',
        date: new Date('2023-12-05T16:00:00'),
        equipment: 'Brother DCP-L2530DW - Comptabilité',
        equipmentId: '4',
        details: {
          technician: 'Jean Dupont',
          duration: '30min',
          parts: ['Cartouche toner noir', 'Cartouche tambour'],
          actions: [
            'Remplacement cartouche toner',
            'Remplacement tambour',
            'Nettoyage têtes d\'impression',
            'Test qualité impression',
            'Mise à jour compteurs'
          ]
        },
        cost: {
          total: 89.90,
          breakdown: {
            labor: 30.00,
            parts: 59.90
          }
        },
        rating: 4
      },
      {
        id: 'INT005',
        title: 'Maintenance préventive',
        description: 'Maintenance préventive avec nettoyage et vérifications de routine.',
        type: 'maintenance',
        status: 'in-progress',
        statusLabel: 'En cours',
        date: new Date('2024-01-16T08:00:00'),
        equipment: 'Brother DCP-L2530DW - Comptabilité',
        equipmentId: '4',
        details: {
          technician: 'Marie Martin',
          duration: 'En cours...',
          parts: [],
          actions: ['Diagnostic en cours...']
        },
        cost: null,
        rating: null
      }
    ];
    
    this.filteredHistory = [...this.historyItems];
  }

  calculateStats(): void {
    this.totalInterventions = this.historyItems.length;
    this.completedInterventions = this.historyItems.filter(item => item.status === 'completed').length;
    
    // Calculate average response time (mock calculation)
    this.averageResponseTime = 4.5;
    
    // Calculate satisfaction rate
    const ratedInterventions = this.historyItems.filter(item => item.rating);
    if (ratedInterventions.length > 0) {
      const totalRating = ratedInterventions.reduce((sum, item) => sum + item.rating, 0);
      this.satisfactionRate = Math.round((totalRating / (ratedInterventions.length * 5)) * 100);
    }
  }

  filterHistory(): void {
    this.filteredHistory = this.historyItems.filter(item => {
      // Status filter
      const statusMatch = !this.selectedStatus || item.status === this.selectedStatus;
      
      // Type filter
      const typeMatch = !this.selectedType || item.type === this.selectedType;
      
      // Equipment filter
      const equipmentMatch = !this.selectedEquipment || item.equipmentId === this.selectedEquipment;
      
      // Period filter
      let periodMatch = true;
      if (this.selectedPeriod) {
        const now = new Date();
        const itemDate = new Date(item.date);
        
        switch (this.selectedPeriod) {
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            periodMatch = itemDate >= weekAgo;
            break;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            periodMatch = itemDate >= monthAgo;
            break;
          case 'quarter':
            const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            periodMatch = itemDate >= quarterAgo;
            break;
          case 'year':
            const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            periodMatch = itemDate >= yearAgo;
            break;
        }
      }
      
      return statusMatch && typeMatch && equipmentMatch && periodMatch;
    });
  }

  resetFilters(): void {
    this.selectedPeriod = '';
    this.selectedType = '';
    this.selectedEquipment = '';
    this.selectedStatus = '';
    this.filteredHistory = [...this.historyItems];
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case 'maintenance': return 'fa-cog';
      case 'repair': return 'fa-wrench';
      case 'installation': return 'fa-plus-circle';
      case 'replacement': return 'fa-exchange-alt';
      default: return 'fa-tools';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'completed': return 'fa-check-circle';
      case 'in-progress': return 'fa-spinner fa-spin';
      case 'cancelled': return 'fa-times-circle';
      default: return 'fa-question-circle';
    }
  }

  goBack(): void {
    this.router.navigate(['/client-dashboard']);
  }

  viewDetails(interventionId: string): void {
    console.log('Viewing details for intervention:', interventionId);
    // Navigate to detailed intervention view
  }

  downloadReport(interventionId: string): void {
    console.log('Downloading report for intervention:', interventionId);
    // Download PDF report
  }

  rateIntervention(interventionId: string): void {
    console.log('Rating intervention:', interventionId);
    // Open rating modal or navigate to rating page
  }
}
