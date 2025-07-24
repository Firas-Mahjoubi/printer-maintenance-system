import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { ImprimanteService, Imprimante } from '../../service/imprimante.service';
import { ContratService, Contrat } from '../../service/contrat.service';

@Component({
  selector: 'app-contrat-printers',
  templateUrl: './contrat-printers.component.html',
  styleUrls: ['./contrat-printers.component.css']
})
export class ContratPrintersComponent implements OnInit {
  contrat: Contrat | null = null;
  imprimantes: Imprimante[] = [];
  filteredImprimantes: Imprimante[] = [];
  loading = true;
  loadingImprimantes = false;
  error: string | null = null;
  errorImprimantes: string | null = null;
  contratId: number;

  // Math object for template use
  Math = Math;

  // Search and filter
  searchTerm = '';
  selectedBrand = '';
  selectedLocation = '';
  sortBy = 'marque';
  sortDirection = 'asc';

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 0;

  // Add printer form
  showAddPrinterForm = false;
  showExcelImport = false;
  newPrinter: Imprimante = {
    id: 0,
    marque: '',
    modele: '',
    emplacement: '',
    numeroSerie: ''
  };

  // Excel import
  selectedFile: File | null = null;
  uploadProgress = 0;
  importing = false;

  // Statistics
  stats = {
    total: 0,
    operational: 0,
    maintenance: 0,
    outOfOrder: 0,
    brands: [] as string[],
    locations: [] as string[]
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private imprimanteService: ImprimanteService,
    private contratService: ContratService
  ) {
    this.contratId = +this.route.snapshot.paramMap.get('id')!;
  }

  ngOnInit(): void {
    this.loadContratDetails();
    this.loadImprimantes();
  }

  loadContratDetails(): void {
    this.loading = true;
    this.error = null;

    this.contratService.getById(this.contratId).subscribe({
      next: (contrat) => {
        this.contrat = contrat;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Erreur lors du chargement des détails du contrat.';
        this.loading = false;
        console.error('Error loading contract details:', error);
      }
    });
  }

  loadImprimantes(): void {
    this.loadingImprimantes = true;
    this.errorImprimantes = null;

    this.imprimanteService.getAllByContrat(this.contratId).subscribe({
      next: (imprimantes) => {
        this.imprimantes = imprimantes;
        this.calculateStats();
        this.applyFiltersAndSort();
        this.loadingImprimantes = false;
      },
      error: (error) => {
        this.errorImprimantes = 'Erreur lors du chargement des imprimantes.';
        this.loadingImprimantes = false;
        console.error('Error loading printers:', error);
      }
    });
  }

  calculateStats(): void {
    this.stats = {
      total: this.imprimantes.length,
      operational: this.imprimantes.length, // Assuming all are operational for now
      maintenance: 0,
      outOfOrder: 0,
      brands: [...new Set(this.imprimantes.map(i => i.marque).filter(Boolean))],
      locations: [...new Set(this.imprimantes.map(i => i.emplacement).filter(Boolean))]
    };
  }

  applyFiltersAndSort(): void {
    let filtered = [...this.imprimantes];

    // Apply search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(imp => 
        imp.marque?.toLowerCase().includes(term) ||
        imp.modele?.toLowerCase().includes(term) ||
        imp.numeroSerie?.toLowerCase().includes(term) ||
        imp.emplacement?.toLowerCase().includes(term)
      );
    }

    // Apply brand filter
    if (this.selectedBrand) {
      filtered = filtered.filter(imp => imp.marque === this.selectedBrand);
    }

    // Apply location filter
    if (this.selectedLocation) {
      filtered = filtered.filter(imp => imp.emplacement === this.selectedLocation);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = '';
      let bValue = '';

      switch (this.sortBy) {
        case 'marque':
          aValue = a.marque || '';
          bValue = b.marque || '';
          break;
        case 'modele':
          aValue = a.modele || '';
          bValue = b.modele || '';
          break;
        case 'emplacement':
          aValue = a.emplacement || '';
          bValue = b.emplacement || '';
          break;
        case 'numeroSerie':
          aValue = a.numeroSerie || '';
          bValue = b.numeroSerie || '';
          break;
      }

      if (this.sortDirection === 'asc') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });

    this.filteredImprimantes = filtered;
    this.totalPages = Math.ceil(filtered.length / this.itemsPerPage);
    this.currentPage = Math.min(this.currentPage, this.totalPages || 1);
  }

  onSearchChange(): void {
    this.onFilterChange();
  }

  onFilterChange(): void {
    // Apply filters
    this.filteredImprimantes = this.imprimantes.filter(imprimante => {
      const matchesSearch = !this.searchTerm || 
        imprimante.marque.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        imprimante.modele.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        imprimante.numeroSerie.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (imprimante.emplacement && imprimante.emplacement.toLowerCase().includes(this.searchTerm.toLowerCase()));
      
      const matchesBrand = !this.selectedBrand || imprimante.marque === this.selectedBrand;
      const matchesLocation = !this.selectedLocation || imprimante.emplacement === this.selectedLocation;
      
      return matchesSearch && matchesBrand && matchesLocation;
    });

    // Apply sorting
    this.filteredImprimantes.sort((a, b) => {
      let valueA: string;
      let valueB: string;
      
      switch (this.sortBy) {
        case 'marque':
          valueA = a.marque || '';
          valueB = b.marque || '';
          break;
        case 'modele':
          valueA = a.modele || '';
          valueB = b.modele || '';
          break;
        case 'emplacement':
          valueA = a.emplacement || '';
          valueB = b.emplacement || '';
          break;
        case 'numeroSerie':
          valueA = a.numeroSerie || '';
          valueB = b.numeroSerie || '';
          break;
        default:
          valueA = a.marque || '';
          valueB = b.marque || '';
      }
      
      const comparison = valueA.localeCompare(valueB);
      return this.sortDirection === 'asc' ? comparison : -comparison;
    });

    // Update pagination
    this.totalPages = Math.ceil(this.filteredImprimantes.length / this.itemsPerPage);
    this.currentPage = 1; // Reset to first page when filtering
  }

  onSortChange(column: string): void {
    if (this.sortBy === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = column;
      this.sortDirection = 'asc';
    }
    this.onFilterChange();
  }

  getPaginationRange(): number[] {
    const range: number[] = [];
    const maxVisiblePages = 5;
    
    if (this.totalPages <= maxVisiblePages) {
      // Show all pages if total pages are less than or equal to max visible pages
      for (let i = 1; i <= this.totalPages; i++) {
        range.push(i);
      }
    } else {
      // Calculate range based on current page
      let start = Math.max(1, this.currentPage - 2);
      let end = Math.min(this.totalPages, start + maxVisiblePages - 1);
      
      // Adjust start if end is maxed out
      if (end === this.totalPages) {
        start = Math.max(1, end - maxVisiblePages + 1);
      }
      
      for (let i = start; i <= end; i++) {
        range.push(i);
      }
    }
    
    return range;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getPaginatedItems(): Imprimante[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredImprimantes.slice(startIndex, endIndex);
  }

  toggleAddPrinterForm(): void {
    this.showAddPrinterForm = !this.showAddPrinterForm;
    if (this.showAddPrinterForm) {
      this.showExcelImport = false;
      // Reset form
      this.newPrinter = {
        id: 0,
        marque: '',
        modele: '',
        emplacement: '',
        numeroSerie: ''
      };
    }
  }

  toggleExcelImport(): void {
    this.showExcelImport = !this.showExcelImport;
    if (this.showExcelImport) {
      this.showAddPrinterForm = false;
      // Reset file selection
      this.selectedFile = null;
      this.uploadProgress = 0;
      this.importing = false;
    }
  }

  cancelAddPrinter(): void {
    this.showAddPrinterForm = false;
    this.newPrinter = {
      id: 0,
      marque: '',
      modele: '',
      emplacement: '',
      numeroSerie: ''
    };
  }

  addPrinter(): void {
    if (!this.newPrinter.marque || !this.newPrinter.modele || !this.newPrinter.numeroSerie) {
      this.showNotification('Champs obligatoires', 'Veuillez remplir tous les champs obligatoires (Marque, Modèle, Numéro de série)', 'error');
      return;
    }

    this.imprimanteService.addToContrat(this.newPrinter, this.contratId).subscribe({
      next: (imprimante) => {
        this.showNotification('Ajout réussi', 'L\'imprimante a été ajoutée avec succès', 'success');
        this.loadImprimantes(); // Refresh the list
        this.cancelAddPrinter(); // Close the form
      },
      error: (error) => {
        console.error('Error adding printer:', error);
        this.showNotification('Erreur d\'ajout', 'Une erreur est survenue lors de l\'ajout de l\'imprimante', 'error');
      }
    });
  }

  refreshImprimantes(): void {
    this.loadImprimantes();
  }

  removePrinter(imprimante: Imprimante): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer l'imprimante ${imprimante.marque} ${imprimante.modele} ?`)) {
      this.imprimanteService.delete(imprimante.id).subscribe({
        next: () => {
          this.showNotification('Suppression réussie', 'L\'imprimante a été supprimée avec succès', 'success');
          this.loadImprimantes(); // Refresh the list
        },
        error: (error) => {
          console.error('Error removing printer:', error);
          this.showNotification('Erreur de suppression', 'Une erreur est survenue lors de la suppression de l\'imprimante', 'error');
        }
      });
    }
  }

  editPrinter(imprimante: Imprimante): void {
    // For now, just show a notification - you can implement inline editing later
    this.showNotification('Modification', 'Fonctionnalité de modification en cours de développement', 'info');
  }

  exportEquipmentList(): void {
    // TODO: Implement export functionality
    console.log('Exporting equipment list');
  }

  goBack(): void {
    this.location.back();
  }

  goToContractDetails(): void {
    this.router.navigate(['/contrats/details', this.contratId]);
  }

  trackByImprimanteId(index: number, imprimante: Imprimante): number {
    return imprimante.id;
  }

  // File handling methods
  onFileSelected(event: any): void {
    console.log('🔍 File selection event triggered:', event);
    const file = event.target.files[0];
    
    if (!file) {
      console.log('❌ No file selected');
      this.selectedFile = null;
      return;
    }

    console.log('📁 File selected:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    // Validate file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv' // .csv
    ];

    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
      console.log('❌ Invalid file type:', file.type);
      this.showNotification('Type de fichier non supporté', 'Veuillez sélectionner un fichier Excel (.xlsx, .xls) ou CSV (.csv)', 'error');
      this.selectedFile = null;
      event.target.value = ''; // Reset file input
      return;
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      console.log('❌ File too large:', file.size);
      this.showNotification('Fichier trop volumineux', 'La taille du fichier ne doit pas dépasser 10MB', 'error');
      this.selectedFile = null;
      event.target.value = ''; // Reset file input
      return;
    }

    this.selectedFile = file;
    console.log('✅ File selected successfully:', file.name);
  }

  removeSelectedFile(): void {
    this.selectedFile = null;
    this.uploadProgress = 0;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  importExcelFile(): void {
    console.log('importExcelFile() called');
    console.log('selectedFile:', this.selectedFile);
    console.log('contratId:', this.contratId);
    console.log('importing:', this.importing);
    
    if (!this.selectedFile) {
      console.error('No file selected');
      this.showNotification('Aucun fichier sélectionné', 'Veuillez sélectionner un fichier à importer.', 'error');
      return;
    }

    if (!this.contratId) {
      console.error('No contract ID available');
      this.showNotification('Erreur de contrat', 'Impossible de déterminer le contrat pour l\'importation.', 'error');
      return;
    }

    console.log('Starting import process...');
    this.importing = true;
    this.uploadProgress = 0;

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      this.uploadProgress += 10;
      if (this.uploadProgress >= 90) {
        clearInterval(progressInterval);
      }
    }, 200);

    console.log('Calling imprimanteService.importFromExcel...');
    this.imprimanteService.importFromExcel(this.selectedFile, this.contratId).subscribe({
      next: (response) => {
        console.log('Import successful:', response);
        clearInterval(progressInterval);
        this.uploadProgress = 100;
        
        setTimeout(() => {
          this.importing = false;
          this.selectedFile = null;
          this.uploadProgress = 0;
          this.showExcelImport = false;
          
          console.log('Refreshing imprimantes list...');
          this.loadImprimantes(); // Refresh the list
          
          // Show success notification with response message
          const message = typeof response === 'string' ? response : 'Les imprimantes ont été importées avec succès.';
          this.showNotification('Import réussi', message, 'success');
        }, 1000);
      },
      error: (error) => {
        console.error('Import failed:', error);
        clearInterval(progressInterval);
        this.importing = false;
        this.uploadProgress = 0;
        
        let errorMessage = 'Une erreur est survenue lors de l\'importation du fichier.';
        if (error.error && typeof error.error === 'string') {
          errorMessage = error.error;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        console.error('Error message:', errorMessage);
        this.showNotification('Erreur d\'import', errorMessage, 'error');
      }
    });
  }

  downloadTemplate(): void {
    // Create a proper Excel-compatible CSV template
    const csvContent = "Marque,Modèle,Numéro de série,Emplacement\n" +
                      "HP,LaserJet Pro M404dn,ABC123456789,Bureau 101\n" +
                      "Canon,PIXMA TS3150,DEF987654321,Réception\n" +
                      "Epson,WorkForce Pro WF-4830,GHI456789123,Salle de conférence\n" +
                      "Brother,HL-L2350DW,JKL789123456,Comptabilité";
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'modele_import_imprimantes.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Show notification
    this.showNotification('Téléchargement', 'Le modèle d\'importation a été téléchargé avec succès', 'success');
  }

  private showNotification(title: string, message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    // Create a simple notification
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'success' ? 'success' : type === 'error' ? 'danger' : 'info'} alert-dismissible fade show position-fixed`;
    notification.style.cssText = `
      top: 20px;
      right: 20px;
      z-index: 9999;
      min-width: 300px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    notification.innerHTML = `
      <strong>${title}</strong><br>
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 5000);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      console.log('📁 File dropped:', file.name);
      
      // Create a synthetic event to reuse the existing file selection logic
      const syntheticEvent = {
        target: {
          files: [file]
        }
      };
      
      this.onFileSelected(syntheticEvent);
    }
  }
}
