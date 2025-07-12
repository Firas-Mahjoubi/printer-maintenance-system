import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ImprimanteService, Imprimante, PrinterStatus } from '../service/imprimante.service';
import { firstValueFrom } from 'rxjs';

interface EquipmentItem {
  id: string;
  name: string;
  model: string;
  location: string;
  serialNumber: string;
  status: string;
  statusLabel: string;
  pageCount: number;
  monthlyPages: number;
  installDate: Date;
  lastMaintenance: Date;
  nextMaintenance: Date;
  supplies?: { name: string, level: number }[];
  recentIssues?: { date: Date, description: string, status: string, statusLabel: string }[];
}

@Component({
  selector: 'app-client-equipment',
  templateUrl: './client-equipment.component.html',
  styleUrls: ['./client-equipment.component.css']
})
export class ClientEquipmentComponent implements OnInit {
  equipmentList: EquipmentItem[] = [];
  filteredEquipment: EquipmentItem[] = [];
  selectedStatus: string = '';
  selectedLocation: string = '';
  uniqueLocations: string[] = [];

  // Stats
  operationalCount: number = 0;
  warningCount: number = 0;
  maintenanceCount: number = 0;
  errorCount: number = 0;

  constructor(
    private router: Router,
    private imprimanteService: ImprimanteService
  ) { }

  ngOnInit(): void {
    this.loadEquipment();
  }

  async loadEquipment(): Promise<void> {
    try {
      // Assuming you can get the current contract ID from localStorage or a service
      const contratId = this.getCurrentContractId();
      
      if (!contratId) {
        console.error('No contract ID available');
        return;
      }
      
      // Get all printers for the current contract
      const printers = await firstValueFrom(this.imprimanteService.getAllByContrat(contratId));
      
      // Get all printer statuses in one call
      const statusesMap = await firstValueFrom(this.imprimanteService.getAllPrinterStatuses());
      
      // Map printers to the equipment format used by this component
      this.equipmentList = printers.map(printer => {
        // Get the status for this printer
        const status = statusesMap[printer.id] || 'Actif';
        
        // Map backend status to frontend status codes
        let statusCode: string;
        switch (status) {
          case 'Actif': statusCode = 'operational'; break;
          case 'En maintenance': statusCode = 'maintenance'; break;
          case 'En panne': statusCode = 'error'; break;
          case 'Hors service': statusCode = 'error'; break;
          default: statusCode = 'operational';
        }
        
        // Create an equipment item with the printer data
        return {
          id: printer.id.toString(),
          name: `${printer.marque} ${printer.modele}`,
          model: printer.modele,
          location: printer.emplacement || 'Non spécifié',
          serialNumber: printer.numeroSerie || 'Non spécifié',
          status: statusCode,
          statusLabel: status,
          pageCount: 0, // These fields are not available in the backend model
          monthlyPages: 0,
          installDate: new Date(),
          lastMaintenance: new Date(),
          nextMaintenance: new Date(),
          supplies: [],
          recentIssues: []
        } as EquipmentItem;
      });
      
      // Initialize filtered equipment
      this.filteredEquipment = [...this.equipmentList];
      
      // Calculate stats and extract locations
      this.calculateStats();
      this.extractUniqueLocations();
      
    } catch (error) {
      console.error('Error loading equipment:', error);
    }
  }
  
  // Helper method to get the current contract ID
  private getCurrentContractId(): number {
    // This should be replaced with your actual method to get the contract ID
    // For example, from localStorage or a user service
    const userDataStr = localStorage.getItem('userData');
    if (userDataStr) {
      try {
        const userData = JSON.parse(userDataStr);
        return userData.contratId || 1; // Default to 1 if not found
      } catch (e) {
        console.error('Error parsing user data', e);
      }
    }
    return 1; // Default contract ID as fallback
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
