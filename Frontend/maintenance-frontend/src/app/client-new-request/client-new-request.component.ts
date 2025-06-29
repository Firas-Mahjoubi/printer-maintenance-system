import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-client-new-request',
  templateUrl: './client-new-request.component.html',
  styleUrls: ['./client-new-request.component.css']
})
export class ClientNewRequestComponent implements OnInit {
  requestData: any = {
    equipmentId: '',
    issueType: '',
    priority: '',
    title: '',
    description: '',
    preferredDate: '',
    contactPhone: ''
  };

  equipmentList: any[] = [];
  attachedFiles: File[] = [];
  isSubmitting: boolean = false;
  minDate: string = '';

  constructor(private router: Router) { }

  ngOnInit(): void {
    this.loadEquipment();
    this.setMinDate();
  }

  loadEquipment(): void {
    // Mock data - replace with actual service call
    this.equipmentList = [
      {
        id: '1',
        name: 'HP LaserJet Pro M404n',
        location: 'Bureau 201',
        model: 'M404n'
      },
      {
        id: '2',
        name: 'Canon Pixma TS3350',
        location: 'Bureau 105',
        model: 'TS3350'
      },
      {
        id: '3',
        name: 'Epson EcoTank L3150',
        location: 'Salle de réunion',
        model: 'L3150'
      },
      {
        id: '4',
        name: 'Brother DCP-L2530DW',
        location: 'Comptabilité',
        model: 'DCP-L2530DW'
      }
    ];
  }

  setMinDate(): void {
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];
  }

  onFileSelected(event: any): void {
    const files = Array.from(event.target.files) as File[];
    
    files.forEach(file => {
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert(`Le fichier ${file.name} est trop volumineux (max 5MB)`);
        return;
      }
      
      // Check file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        alert(`Le type de fichier ${file.name} n'est pas autorisé`);
        return;
      }
      
      this.attachedFiles.push(file);
    });
    
    // Clear the input
    event.target.value = '';
  }

  removeFile(index: number): void {
    this.attachedFiles.splice(index, 1);
  }

  getFileIcon(fileType: string): string {
    if (fileType.includes('image')) {
      return 'fa-image';
    } else if (fileType.includes('pdf')) {
      return 'fa-file-pdf';
    }
    return 'fa-file';
  }

  submitRequest(): void {
    if (this.isSubmitting) return;
    
    this.isSubmitting = true;
    
    // Create form data for submission
    const formData = new FormData();
    formData.append('equipmentId', this.requestData.equipmentId);
    formData.append('issueType', this.requestData.issueType);
    formData.append('priority', this.requestData.priority);
    formData.append('title', this.requestData.title);
    formData.append('description', this.requestData.description);
    formData.append('preferredDate', this.requestData.preferredDate);
    formData.append('contactPhone', this.requestData.contactPhone);
    
    // Add files
    this.attachedFiles.forEach((file, index) => {
      formData.append(`file_${index}`, file);
    });
    
    // Simulate API call
    setTimeout(() => {
      console.log('Request submitted:', this.requestData);
      console.log('Attached files:', this.attachedFiles);
      
      this.isSubmitting = false;
      
      // Show success message and redirect
      alert('Votre demande a été envoyée avec succès ! Vous recevrez une confirmation par email.');
      this.router.navigate(['/client-requests']);
    }, 2000);
  }

  goBack(): void {
    if (this.hasUnsavedChanges()) {
      if (confirm('Vous avez des modifications non sauvegardées. Êtes-vous sûr de vouloir quitter ?')) {
        this.router.navigate(['/client-dashboard']);
      }
    } else {
      this.router.navigate(['/client-dashboard']);
    }
  }

  private hasUnsavedChanges(): boolean {
    return !!(this.requestData.title || 
             this.requestData.description || 
             this.requestData.equipmentId || 
             this.requestData.issueType || 
             this.requestData.priority ||
             this.attachedFiles.length > 0);
  }
}
