import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-client-equipment',
  templateUrl: './client-equipment.component.html',
  styleUrls: ['./client-equipment.component.css']
})
export class ClientEquipmentComponent implements OnInit {
  equipmentList: any[] = [];
  filteredEquipment: any[] = [];
  selectedStatus: string = '';
  selectedLocation: string = '';
  uniqueLocations: string[] = [];

  // Stats
  operationalCount: number = 0;
  warningCount: number = 0;
  maintenanceCount: number = 0;
  errorCount: number = 0;

  constructor(private router: Router) { }

  ngOnInit(): void {
    this.loadEquipment();
    this.calculateStats();
    this.extractUniqueLocations();
  }

  loadEquipment(): void {
    // Mock data - replace with actual service call
    this.equipmentList = [
      {
        id: '1',
        name: 'HP LaserJet Pro M404n',
        model: 'M404n',
        location: 'Bureau 201',
        serialNumber: 'HP001234567',
        status: 'operational',
        statusLabel: 'Opérationnel',
        pageCount: 15420,
        monthlyPages: 1250,
        installDate: new Date('2023-03-15'),
        lastMaintenance: new Date('2024-01-10'),
        nextMaintenance: new Date('2024-04-10'),
        supplies: [
          { name: 'Toner noir', level: 75 },
          { name: 'Tambour', level: 45 }
        ],
        recentIssues: []
      },
      {
        id: '2',
        name: 'Canon Pixma TS3350',
        model: 'TS3350',
        location: 'Bureau 105',
        serialNumber: 'CN001987654',
        status: 'warning',
        statusLabel: 'Attention requise',
        pageCount: 8950,
        monthlyPages: 650,
        installDate: new Date('2023-07-22'),
        lastMaintenance: new Date('2023-12-15'),
        nextMaintenance: new Date('2024-03-15'),
        supplies: [
          { name: 'Encre noire', level: 15 },
          { name: 'Encre couleur', level: 25 }
        ],
        recentIssues: [
          {
            date: new Date('2024-01-12'),
            description: 'Qualité d\'impression dégradée',
            status: 'pending',
            statusLabel: 'En attente'
          }
        ]
      },
      {
        id: '3',
        name: 'Epson EcoTank L3150',
        model: 'L3150',
        location: 'Salle de réunion',
        serialNumber: 'EP002345789',
        status: 'maintenance',
        statusLabel: 'En maintenance',
        pageCount: 12300,
        monthlyPages: 890,
        installDate: new Date('2023-05-10'),
        lastMaintenance: new Date('2024-01-15'),
        nextMaintenance: new Date('2024-04-15'),
        supplies: [
          { name: 'Réservoir noir', level: 60 },
          { name: 'Réservoir couleur', level: 70 }
        ],
        recentIssues: [
          {
            date: new Date('2024-01-15'),
            description: 'Maintenance préventive en cours',
            status: 'in-progress',
            statusLabel: 'En cours'
          }
        ]
      },
      {
        id: '4',
        name: 'Brother DCP-L2530DW',
        model: 'DCP-L2530DW',
        location: 'Comptabilité',
        serialNumber: 'BR003456890',
        status: 'error',
        statusLabel: 'Hors service',
        pageCount: 22100,
        monthlyPages: 0,
        installDate: new Date('2022-11-08'),
        lastMaintenance: new Date('2023-11-08'),
        nextMaintenance: new Date('2024-02-08'),
        supplies: [
          { name: 'Toner noir', level: 0 },
          { name: 'Tambour', level: 20 }
        ],
        recentIssues: [
          {
            date: new Date('2024-01-10'),
            description: 'Bourrage papier récurrent',
            status: 'pending',
            statusLabel: 'En attente'
          },
          {
            date: new Date('2024-01-08'),
            description: 'Erreur système',
            status: 'pending',
            statusLabel: 'En attente'
          }
        ]
      }
    ];
    
    this.filteredEquipment = [...this.equipmentList];
  }

  calculateStats(): void {
    this.operationalCount = this.equipmentList.filter(eq => eq.status === 'operational').length;
    this.warningCount = this.equipmentList.filter(eq => eq.status === 'warning').length;
    this.maintenanceCount = this.equipmentList.filter(eq => eq.status === 'maintenance').length;
    this.errorCount = this.equipmentList.filter(eq => eq.status === 'error').length;
  }

  extractUniqueLocations(): void {
    this.uniqueLocations = [...new Set(this.equipmentList.map(eq => eq.location))];
  }

  filterEquipment(): void {
    this.filteredEquipment = this.equipmentList.filter(equipment => {
      const statusMatch = !this.selectedStatus || equipment.status === this.selectedStatus;
      const locationMatch = !this.selectedLocation || equipment.location === this.selectedLocation;
      return statusMatch && locationMatch;
    });
  }

  resetFilters(): void {
    this.selectedStatus = '';
    this.selectedLocation = '';
    this.filteredEquipment = [...this.equipmentList];
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'operational': return 'fa-check-circle';
      case 'warning': return 'fa-exclamation-triangle';
      case 'maintenance': return 'fa-tools';
      case 'error': return 'fa-times-circle';
      default: return 'fa-question-circle';
    }
  }

  getMaintenanceStatus(nextMaintenance: Date): string {
    const now = new Date();
    const diffTime = nextMaintenance.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'overdue';
    if (diffDays <= 7) return 'due-soon';
    return 'normal';
  }

  getSupplyStatus(level: number): string {
    if (level <= 10) return 'critical';
    if (level <= 25) return 'low';
    if (level <= 50) return 'medium';
    return 'good';
  }

  goBack(): void {
    this.router.navigate(['/client-dashboard']);
  }

  viewDetails(equipmentId: string): void {
    console.log('Viewing details for equipment:', equipmentId);
    // Navigate to equipment details page
  }

  createRequest(equipmentId: string): void {
    this.router.navigate(['/client-new-request'], { 
      queryParams: { equipmentId: equipmentId } 
    });
  }

  viewHistory(equipmentId: string): void {
    this.router.navigate(['/client-history'], { 
      queryParams: { equipmentId: equipmentId } 
    });
  }
}
