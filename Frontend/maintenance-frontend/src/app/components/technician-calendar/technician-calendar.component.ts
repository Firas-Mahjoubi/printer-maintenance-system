import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CalendarOptions, EventApi, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { 
  InterventionService, 
  InterventionDTO, 
  TypeIntervention, 
  PrioriteIntervention, 
  StatutIntervention 
} from '../../service/intervention.service';
import { ContratService, Contrat } from '../../service/contrat.service';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

interface Technician {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  specialite: string;
  disponible: boolean;
  avatar?: string;
}

@Component({
  selector: 'app-technician-calendar',
  templateUrl: './technician-calendar.component.html',
  styleUrls: ['./technician-calendar.component.css']
})
export class TechnicianCalendarComponent implements OnInit {
  @ViewChild('calendar') calendarComponent: any;
  
  // Make enums available to the template
  TypeIntervention = TypeIntervention;
  PrioriteIntervention = PrioriteIntervention;
  StatutIntervention = StatutIntervention;
  
  // Current date for display
  currentDate: Date = new Date();
  
  // Selected event for detail view
  selectedEvent: InterventionDTO | null = null;
  viewOnly: boolean = true;
  
  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin],
    initialView: 'timeGridWeek',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek,resourceTimelineWeek'
    },
    weekends: true,
    selectable: true,
    selectMirror: true,
    dayMaxEvents: true,
    events: [],
    eventClick: this.handleEventClick.bind(this),
    select: this.handleDateSelect.bind(this),
    height: 'auto',
    slotDuration: '00:30:00',
    slotLabelInterval: '01:00',
    businessHours: {
      daysOfWeek: [1, 2, 3, 4, 5], // Monday - Friday
      startTime: '08:00',
      endTime: '18:00',
    },
    // Make background events always non-blocking 
    // for date selection and event creation
    selectAllow: (selectInfo) => {
      // Always allow selection, even on days with contract expirations
      return true;
    },
    nowIndicator: true,
    allDaySlot: true,
    navLinks: true, // clickable day/week names
    editable: true, // allow dragging events
    dayMaxEventRows: true, // for all non-TimeGrid views
    dayHeaderFormat: { weekday: 'long', day: 'numeric', month: 'short' },
    weekNumbers: true,
    weekNumberCalculation: 'ISO',
    weekText: 'S',
    firstDay: 1, // Monday
    slotLabelFormat: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    },
    eventTimeFormat: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    },
    views: {
      timeGridWeek: {
        dayHeaderFormat: { weekday: 'short', day: '2-digit', month: 'short' },
        slotLabelFormat: {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }
      },
      dayGridMonth: {
        dayHeaderFormat: { weekday: 'short' }
      }
    },
    eventClassNames: (arg) => {
      if (arg.event.extendedProps && arg.event.extendedProps['isContractExpiration']) {
        return ['contract-expiration-event']; // Use our new class
      }
      const priority = arg.event.extendedProps ? arg.event.extendedProps['priorite'] || 'NORMALE' : 'NORMALE';
      const type = arg.event.extendedProps ? arg.event.extendedProps['type'] || '' : '';
      const status = arg.event.extendedProps ? arg.event.extendedProps['statut'] || '' : '';
      
      return [`priority-${priority.toLowerCase()}`];
    },
    eventDidMount: (info) => {
      // Check if this is a contract expiration event
      if (info.event.extendedProps && info.event.extendedProps['isContractExpiration']) {
        // Get contracts data from our enhanced structure
        interface ContractInfo {
          contractNumber: string;
          clientName: string;
          endDate: Date | string;
          contractId: string | number;
          startDate?: Date | string | null;
        }
        
        // Get contracts directly from the event's extendedProps
        const contractCount = info.event.extendedProps['contractCount'] || 1;
        const contracts = info.event.extendedProps['contracts'] || [];
        
        // Use contracts from extendedProps if available (our new structure)
        // or fallback to the old structure for backward compatibility
        const expiringContracts: ContractInfo[] = contracts.length > 0 ? 
          contracts : 
          [{
            contractNumber: info.event.extendedProps['contractNumber'] || '',
            clientName: info.event.extendedProps['clientName'] || '',
            endDate: info.event.extendedProps['endDate'] || new Date(),
            contractId: info.event.extendedProps['contractId'] || '',
            startDate: info.event.extendedProps['startDate'] || null
          }];
        
        // Create tooltip for contract expiration events
        const tooltip = document.createElement('div');
        tooltip.className = 'event-tooltip contract-tooltip';
        
        // Add title to tooltip
        const title = document.createElement('h6');
        if (contractCount > 1) {
          title.textContent = `${contractCount} contrats expirent le ${new Date(expiringContracts[0].endDate).toLocaleDateString()}`;
        } else {
          title.textContent = `Expiration: ${expiringContracts[0].contractNumber}`;
        }
        tooltip.appendChild(title);
        
        // Add contract details to tooltip
        expiringContracts.forEach(contract => {
          const contractDiv = document.createElement('div');
          contractDiv.className = 'contract-expiration-item';
          
          if (expiringContracts.length > 1) {
            const contractHeader = document.createElement('h6');
            contractHeader.textContent = contract.contractNumber;
            contractHeader.style.fontSize = '0.9rem';
            contractHeader.style.marginTop = '8px';
            contractHeader.style.marginBottom = '4px';
            contractDiv.appendChild(contractHeader);
          }
          
          const client = document.createElement('p');
          client.innerHTML = `<i class="bi bi-person"></i> Client: ${contract.clientName}`;
          client.style.margin = '2px 0';
          contractDiv.appendChild(client);
          
          if (expiringContracts.length === 1) {
            const contractNumber = document.createElement('p');
            contractNumber.innerHTML = `<i class="bi bi-file-earmark-text"></i> N° Contrat: ${contract.contractNumber}`;
            contractNumber.style.margin = '2px 0';
            contractDiv.appendChild(contractNumber);
          }
          
          tooltip.appendChild(contractDiv);
        });
        
        if (expiringContracts.length === 1 && expiringContracts[0].endDate) {
          const dates = document.createElement('p');
          dates.innerHTML = `<i class="bi bi-calendar-range"></i> Expiration: ${new Date(expiringContracts[0].endDate).toLocaleDateString()}`;
          tooltip.appendChild(dates);
        }
        
        // Add tooltip to event
        info.el.addEventListener('mouseover', () => {
          document.body.appendChild(tooltip);
          const rect = info.el.getBoundingClientRect();
          tooltip.style.position = 'absolute';
          tooltip.style.left = rect.right + 10 + 'px';
          tooltip.style.top = rect.top + 'px';
          tooltip.style.zIndex = '10000';
        });
        
        info.el.addEventListener('mouseout', () => {
          if (document.body.contains(tooltip)) {
            document.body.removeChild(tooltip);
          }
        });
        
        return;
      }
      
      // Regular intervention event
      const intervention = info.event.extendedProps as InterventionDTO;
      const tooltip = document.createElement('div');
      tooltip.className = 'event-tooltip';
      
      // Create enhanced tooltip
      const title = document.createElement('h6');
      title.textContent = info.event.title;
      tooltip.appendChild(title);
      
      // Add more detailed information
      const type = document.createElement('p');
      type.innerHTML = `<i class="bi bi-tag"></i> ${this.formatType(intervention.type || '')}`;
      tooltip.appendChild(type);
      
      if (intervention.imprimanteModele) {
        const printer = document.createElement('p');
        printer.innerHTML = `<i class="bi bi-printer"></i> ${intervention.imprimanteModele}`;
        tooltip.appendChild(printer);
      }
      
      if (intervention.demandeurNom) {
        const requester = document.createElement('p');
        requester.innerHTML = `<i class="bi bi-person"></i> ${intervention.demandeurNom}`;
        tooltip.appendChild(requester);
      }
      
      const status = document.createElement('p');
      status.innerHTML = `<i class="bi bi-info-circle"></i> ${this.formatStatus(intervention.statut || '')}`;
      tooltip.appendChild(status);
      
      if (intervention.technicienNom) {
        const technician = document.createElement('p');
        technician.innerHTML = `<i class="bi bi-person-gear"></i> ${intervention.technicienNom}`;
        tooltip.appendChild(technician);
      }
      
      // Time information
      const time = document.createElement('p');
      let timeText = '';
      if (intervention.datePlanifiee) {
        const date = new Date(intervention.datePlanifiee);
        timeText = `<i class="bi bi-clock"></i> ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        if (intervention.dateFin) {
          const end = new Date(intervention.dateFin);
          timeText += ` - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        }
      }
      if (timeText) {
        time.innerHTML = timeText;
        tooltip.appendChild(time);
      }
      
      // Add tooltip functionality
      info.el.addEventListener('mouseover', () => {
        document.body.appendChild(tooltip);
        const rect = info.el.getBoundingClientRect();
        tooltip.style.position = 'absolute';
        tooltip.style.left = rect.right + 10 + 'px';
        tooltip.style.top = rect.top + 'px';
        tooltip.style.zIndex = '10000';
      });
      
      info.el.addEventListener('mouseout', () => {
        if (document.body.contains(tooltip)) {
          document.body.removeChild(tooltip);
        }
      });
      
      // Add metadata to the event display if we're in a timeline view or day view
      // This enhances the visual information directly in the event element
      if (info.view.type.includes('timeGrid')) {
        // Create a metadata container that will appear below the title
        const metadataElement = document.createElement('div');
        metadataElement.className = 'event-metadata';
        
        // Add icons and information based on what's available
        if (intervention.type) {
          const typeSpan = document.createElement('span');
          typeSpan.innerHTML = this.getTypeIcon(intervention.type);
          metadataElement.appendChild(typeSpan);
        }
        
        if (intervention.imprimanteModele) {
          const printerSpan = document.createElement('span');
          printerSpan.innerHTML = `<i class="bi bi-printer"></i> ${intervention.imprimanteModele.substring(0, 12)}`;
          metadataElement.appendChild(printerSpan);
        }
        
        if (intervention.demandeurNom) {
          const clientSpan = document.createElement('span');
          clientSpan.innerHTML = `<i class="bi bi-person"></i> ${intervention.demandeurNom.split(' ')[0]}`;
          metadataElement.appendChild(clientSpan);
        }
        
        // Find the event title element and insert our metadata after it
        const titleElement = info.el.querySelector('.fc-event-title');
        if (titleElement && titleElement.parentNode) {
          titleElement.parentNode.insertBefore(metadataElement, titleElement.nextSibling);
        }
      }
    }
  };
  
  events: EventInput[] = [];
  technicians: Technician[] = [];
  selectedTechnicianId: number | null = null;
  
  loading: boolean = true;
  error: string | null = null;
  
  // Event Form
  eventForm: FormGroup;
  showEventForm: boolean = false;
  isEditMode: boolean = false;
  currentEventId: number | null = null;
  
  // Filter options
  filterForm: FormGroup;
  
  // Statistics
  totalInterventions: number = 0;
  pendingInterventions: number = 0;
  scheduledInterventions: number = 0;
  completedInterventions: number = 0;
  
  // Type and status mappings for display
  typeMapping = {
    [TypeIntervention.PREVENTIVE]: 'Préventive',
    [TypeIntervention.CORRECTIVE]: 'Corrective',
    [TypeIntervention.URGENTE]: 'Urgente',
    [TypeIntervention.INSTALLATION]: 'Installation',
    [TypeIntervention.MAINTENANCE]: 'Maintenance',
    [TypeIntervention.FORMATION]: 'Formation',
    [TypeIntervention.MISE_A_JOUR]: 'Mise à jour',
    [TypeIntervention.DIAGNOSTIC]: 'Diagnostic',
    [TypeIntervention.NETTOYAGE]: 'Nettoyage'
  };
  
  statusMapping = {
    [StatutIntervention.EN_ATTENTE]: 'En attente',
    [StatutIntervention.PLANIFIEE]: 'Planifiée',
    [StatutIntervention.EN_COURS]: 'En cours',
    [StatutIntervention.EN_PAUSE]: 'En pause',
    [StatutIntervention.TERMINEE]: 'Terminée',
    [StatutIntervention.ANNULEE]: 'Annulée',
    [StatutIntervention.REPORTEE]: 'Reportée',
    [StatutIntervention.REJETEE]: 'Rejetée',
    [StatutIntervention.ATTENTE_PIECES]: 'Attente pièces',
    [StatutIntervention.ATTENTE_CLIENT]: 'Attente client'
  };
  
  priorityMapping = {
    [PrioriteIntervention.BASSE]: 'Basse',
    [PrioriteIntervention.NORMALE]: 'Normale',
    [PrioriteIntervention.HAUTE]: 'Haute',
    [PrioriteIntervention.CRITIQUE]: 'Critique'
  };

  constructor(
    private http: HttpClient,
    private interventionService: InterventionService,
    private contratService: ContratService,
    private fb: FormBuilder
  ) {
    // Initialize forms
    this.eventForm = this.fb.group({
      titre: ['', Validators.required],
      description: ['', Validators.required],
      type: [TypeIntervention.CORRECTIVE, Validators.required],
      priorite: [PrioriteIntervention.NORMALE, Validators.required],
      datePlanifiee: ['', Validators.required],
      heurePlanifiee: ['08:00', Validators.required],
      duree: [2, [Validators.required, Validators.min(0.5), Validators.max(8)]],
      contratId: [null, Validators.required],
      imprimanteId: [null],
      demandeurId: [null, Validators.required],
      technicienId: [null]
    });
    
    this.filterForm = this.fb.group({
      technicienId: [null],
      statut: [null],
      type: [null],
      priorite: [null],
      dateDebut: [null],
      dateFin: [null]
    });
  }

  ngOnInit(): void {
    this.loadTechnicians();
    this.loadContracts();
    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilters();
    });
    
    // Initialize the current date
    setTimeout(() => {
      if (this.calendarComponent) {
        this.currentDate = this.calendarComponent.getApi().getDate();
      }
    }, 0);
  }
  
  // Update current date when the calendar date changes
  handleCalendarDateChange(): void {
    if (this.calendarComponent) {
      this.currentDate = this.calendarComponent.getApi().getDate();
    }
  }
  
  loadTechnicians(): void {
    // In a real app, you would fetch this from your backend API
    // For now, we'll use sample data
    this.technicians = [
      { id: 1, nom: 'Dupont', prenom: 'Jean', email: 'jean.dupont@example.com', telephone: '0123456789', specialite: 'Imprimantes laser', disponible: true },
      { id: 2, nom: 'Martin', prenom: 'Sophie', email: 'sophie.martin@example.com', telephone: '0123456790', specialite: 'Imprimantes jet d\'encre', disponible: true },
      { id: 3, nom: 'Dubois', prenom: 'Pierre', email: 'pierre.dubois@example.com', telephone: '0123456791', specialite: 'Multifonctions', disponible: false },
      { id: 4, nom: 'Leroy', prenom: 'Marie', email: 'marie.leroy@example.com', telephone: '0123456792', specialite: 'Scanners', disponible: true },
      { id: 5, nom: 'Moreau', prenom: 'Philippe', email: 'philippe.moreau@example.com', telephone: '0123456793', specialite: 'Grands formats', disponible: true }
    ];
    
    this.loadInterventions();
  }
  
  loadContracts(): void {
    this.contratService.getActiveContracts().pipe(
      catchError(error => {
        this.error = 'Erreur lors du chargement des contrats: ' + error.message;
        return of([]);
      })
    ).subscribe(contracts => {
      // Add contract expiration dates to calendar
      const contractEvents = this.mapContractsToEvents(contracts);
      this.events = [...this.events, ...contractEvents];
      
      // Update calendar events if already loaded
      if (this.calendarOptions.events) {
        this.calendarOptions.events = this.events;
      }
    });
  }
  
  loadInterventions(): void {
    this.loading = true;
    
    // Get interventions from the service
    this.interventionService.obtenirTickets(
      undefined, // statut
      undefined, // type
      undefined, // priorite
      this.selectedTechnicianId || undefined, // technicienId - convert null to undefined
      undefined, // demandeurId
      undefined, // contratId
      undefined, // dateDebut
      undefined, // dateFin
      0, // page
      1000 // size - get more to show in calendar
    ).pipe(
      catchError(error => {
        this.error = 'Erreur lors du chargement des interventions: ' + error.message;
        this.loading = false;
        return of({ content: [], totalElements: 0, totalPages: 0, size: 0, number: 0, first: true, last: true });
      })
    ).subscribe(response => {
      this.mapInterventionsToEvents(response.content);
      this.updateStatistics(response.content);
      this.loading = false;
    });
  }
  
  mapContractsToEvents(contracts: Contrat[]): EventInput[] {
    // Group contracts by expiration date to avoid overlapping events
    const contractsByDate = new Map<string, Contrat[]>();
    
    contracts.forEach(contract => {
      const expirationDate = new Date(contract.dateFin);
      const dateKey = expirationDate.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      if (!contractsByDate.has(dateKey)) {
        contractsByDate.set(dateKey, []);
      }
      contractsByDate.get(dateKey)?.push(contract);
    });
    
    // Create one event per date, with all contracts in extendedProps
    const events: EventInput[] = [];
    
    contractsByDate.forEach((dateContracts, dateKey) => {
      const firstContract = dateContracts[0];
      const expirationDate = new Date(firstContract.dateFin);
      
      events.push({
        id: `contract-expiration-${dateKey}`,
        title: dateContracts.length === 1 
          ? `Expiration: ${firstContract.numeroContrat}`
          : `${dateContracts.length} contrats expirent`,
        start: expirationDate,
        allDay: true,
        display: 'block',  // Regular event (not background)
        backgroundColor: '#dc3545', // Red background
        borderColor: '#b02a37', // Darker red border
        textColor: '#fff',  // White text
        classNames: ['contract-expiration-event'],
        extendedProps: {
          isContractExpiration: true,
          expirationDate: dateKey,
          contractCount: dateContracts.length,
          // Store all contracts for this date
          contracts: dateContracts.map(contract => ({
            contractId: contract.id,
            contractNumber: contract.numeroContrat,
            clientName: contract.client ? `${contract.client.prenom} ${contract.client.nom}` : 'Client inconnu',
            startDate: contract.dateDebut,
            endDate: contract.dateFin
          }))
        }
      });
    });
    
    return events;
  }
  
  mapInterventionsToEvents(interventions: InterventionDTO[]): void {
    // Save contract events if they exist
    const contractEvents = this.events.filter(event => 
      event.extendedProps && event.extendedProps['isContractExpiration']
    );
    
    // Map interventions to events with enhanced display
    const interventionEvents = interventions.map(intervention => {
      // Calculate end time based on default duration if not available
      const startDate = intervention.datePlanifiee ? new Date(intervention.datePlanifiee) : 
                      intervention.dateCreation ? new Date(intervention.dateCreation) : new Date();
      
      let endDate: Date;
      if (intervention.dateFin) {
        endDate = new Date(intervention.dateFin);
      } else {
        // Default duration: 2 hours
        endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
      }
      
      // Get color based on priority
      let color = this.getPriorityColor(intervention.priorite);
      
      // Build a more descriptive title
      let eventTitle = intervention.titre;
      if (intervention.imprimanteModele) {
        eventTitle += ` (${intervention.imprimanteModele})`;
      }
      
      return {
        id: intervention.id?.toString(),
        title: eventTitle,
        start: startDate,
        end: endDate,
        color: color,
        extendedProps: {
          ...intervention,
          // Add metadata for display in eventContent
          clientName: intervention.demandeurNom,
          printerModel: intervention.imprimanteModele,
          technicianName: intervention.technicienNom
        }
      };
    });
    
    // Combine intervention events with contract events
    this.events = [...interventionEvents, ...contractEvents];
    
    // Update calendar events
    this.calendarOptions.events = this.events;
  }
  
  updateStatistics(interventions: InterventionDTO[]): void {
    this.totalInterventions = interventions.length;
    this.pendingInterventions = interventions.filter(i => i.statut === StatutIntervention.EN_ATTENTE).length;
    this.scheduledInterventions = interventions.filter(i => i.statut === StatutIntervention.PLANIFIEE).length;
    this.completedInterventions = interventions.filter(i => i.statut === StatutIntervention.TERMINEE).length;
  }
  
  getPriorityColor(priority?: PrioriteIntervention): string {
    if (!priority) return '#4285F4'; // Default blue
    
    switch(priority) {
      case PrioriteIntervention.CRITIQUE:
        return '#DB4437'; // Red
      case PrioriteIntervention.HAUTE:
        return '#F4B400'; // Amber
      case PrioriteIntervention.NORMALE:
        return '#4285F4'; // Blue
      case PrioriteIntervention.BASSE:
        return '#0F9D58'; // Green
      default:
        return '#4285F4'; // Default blue
    }
  }
  
  formatType(type: string | null | undefined): string {
    if (!type) return 'Non défini';
    return this.typeMapping[type as TypeIntervention] || type;
  }
  
  formatStatus(status: string | null | undefined): string {
    if (!status) return 'Non défini';
    return this.statusMapping[status as StatutIntervention] || status;
  }
  
  formatPriority(priority: string | null | undefined): string {
    if (!priority) return 'Non défini';
    return this.priorityMapping[priority as PrioriteIntervention] || priority;
  }
  
  applyFilters(): void {
    const filters = this.filterForm.value;
    
    // Apply technician filter
    this.selectedTechnicianId = filters.technicienId;
    
    // Reload interventions with filters
    this.loadInterventions();
  }
  
  handleTechnicianChange(technicianId: number): void {
    this.selectedTechnicianId = technicianId;
    this.filterForm.patchValue({ technicienId: technicianId });
    this.loadInterventions();
  }
  
  getTypeIcon(type: string): string {
    switch(type) {
      case TypeIntervention.PREVENTIVE:
        return '<i class="bi bi-tools"></i>';
      case TypeIntervention.CORRECTIVE:
        return '<i class="bi bi-wrench"></i>';
      case TypeIntervention.URGENTE:
        return '<i class="bi bi-exclamation-circle"></i>';
      case TypeIntervention.INSTALLATION:
        return '<i class="bi bi-hdd"></i>';
      case TypeIntervention.MAINTENANCE:
        return '<i class="bi bi-gear"></i>';
      case TypeIntervention.FORMATION:
        return '<i class="bi bi-mortarboard"></i>';
      case TypeIntervention.MISE_A_JOUR:
        return '<i class="bi bi-arrow-up-circle"></i>';
      case TypeIntervention.DIAGNOSTIC:
        return '<i class="bi bi-search"></i>';
      case TypeIntervention.NETTOYAGE:
        return '<i class="bi bi-brush"></i>';
      default:
        return '<i class="bi bi-question-circle"></i>';
    }
  }
 
  
  handleEventClick(info: { event: EventApi }): void {
    // Check if this is a contract expiration event
    if (info.event.extendedProps && info.event.extendedProps['isContractExpiration']) {
      // Get the contracts array from the event
      const contracts = info.event.extendedProps['contracts'] || [];
      const contractCount = info.event.extendedProps['contractCount'] || 1;
      
      if (contractCount > 1 && contracts.length > 1) {
        // Multiple contracts expiring on the same date
        let message = `${contractCount} contrats expirent le ${new Date(contracts[0].endDate).toLocaleDateString()}:\n\n`;
        contracts.forEach((contract: any, index: number) => {
          message += `${index + 1}. ${contract.contractNumber} - ${contract.clientName}\n`;
        });
        alert(message);
      } else {
        // Single contract expiration
        const contract = contracts[0] || {};
        const contractId = contract.contractId || info.event.extendedProps['contractId'];
        const contractNumber = contract.contractNumber || info.event.extendedProps['contractNumber'];
        const clientName = contract.clientName || info.event.extendedProps['clientName'];
        const endDate = contract.endDate || info.event.extendedProps['endDate'];
        
        // Display contract information in a nicer alert or modal
        alert(`Expiration du contrat: ${contractNumber}\nClient: ${clientName}\nDate d'expiration: ${new Date(endDate).toLocaleDateString()}\nID: ${contractId}`);
      }
      return;
    }
    
    // For intervention events
    const intervention = info.event.extendedProps as InterventionDTO;
    
    // Store the selected event
    this.selectedEvent = intervention;
    
    // Open event details in view mode by default
    this.isEditMode = true;
    this.viewOnly = true;
    this.currentEventId = intervention.id || null;
    
    // Populate form with event data
    const date = intervention.datePlanifiee ? new Date(intervention.datePlanifiee) : new Date();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    this.eventForm.patchValue({
      titre: intervention.titre,
      description: intervention.description || '',
      type: intervention.type || TypeIntervention.CORRECTIVE,
      priorite: intervention.priorite || PrioriteIntervention.NORMALE,
      datePlanifiee: this.formatDateForInput(date),
      heurePlanifiee: `${hours}:${minutes}`,
      contratId: intervention.contratId || null,
      imprimanteId: intervention.imprimanteId || null,
      demandeurId: intervention.demandeurId || null,
      technicienId: intervention.technicienId || null
    });
    
    // Calculate duration if we have start and end dates
    if (intervention.datePlanifiee && intervention.dateFin) {
      const startTime = new Date(intervention.datePlanifiee).getTime();
      const endTime = new Date(intervention.dateFin).getTime();
      const durationHours = (endTime - startTime) / (1000 * 60 * 60);
      this.eventForm.patchValue({
        duree: Math.max(0.5, Math.round(durationHours * 2) / 2) // Round to nearest 0.5
      });
    } else {
      this.eventForm.patchValue({
        duree: 2 // Default 2 hours
      });
    }
    
    // Show the modal with intervention details
    this.showEventForm = true;
    
    // Apply priority-based styling to the modal header
    setTimeout(() => {
      const modalHeader = document.querySelector('.modal-header');
      if (modalHeader) {
        // Clear any existing priority classes
        modalHeader.classList.remove('priority-critique', 'priority-haute', 'priority-normale', 'priority-basse');
        // Add the appropriate priority class
        if (intervention.priorite) {
          modalHeader.classList.add(`priority-${intervention.priorite.toLowerCase()}`);
        }
      }
    }, 0);
  }
  
  handleDateSelect(selectInfo: any): void {
    // Reset form for new event
    this.isEditMode = false;
    this.currentEventId = null;
    
    const selectedDate = selectInfo.start;
    const hours = selectedDate.getHours().toString().padStart(2, '0');
    const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
    
    this.eventForm.patchValue({
      titre: '',
      description: '',
      type: TypeIntervention.CORRECTIVE,
      priorite: PrioriteIntervention.NORMALE,
      datePlanifiee: this.formatDateForInput(selectedDate),
      heurePlanifiee: `${hours}:${minutes}`,
      duree: 2,
      technicienId: this.selectedTechnicianId
    });
    
    this.showEventForm = true;
  }
  
  formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }
  
  saveEvent(): void {
    if (this.eventForm.invalid) {
      return;
    }
    
    const formValues = this.eventForm.value;
    
    // Combine date and time
    const dateParts = formValues.datePlanifiee.split('-');
    const timeParts = formValues.heurePlanifiee.split(':');
    const datePlanifiee = new Date(
      parseInt(dateParts[0]), 
      parseInt(dateParts[1]) - 1, 
      parseInt(dateParts[2]),
      parseInt(timeParts[0]),
      parseInt(timeParts[1])
    );
    
    if (this.isEditMode && this.currentEventId) {
      // Update existing intervention
      const updateData = {
        titre: formValues.titre,
        description: formValues.description,
        type: formValues.type,
        priorite: formValues.priorite,
        datePlanifiee: datePlanifiee,
        contratId: formValues.contratId,
        imprimanteId: formValues.imprimanteId,
        technicienId: formValues.technicienId
      };
      
      this.interventionService.mettreAJourTicket(this.currentEventId, updateData).subscribe(
        result => {
          this.showEventForm = false;
          this.loadInterventions();
        },
        error => {
          this.error = `Erreur lors de la mise à jour: ${error.message}`;
        }
      );
    } else {
      // Create new intervention
      const newIntervention = {
        titre: formValues.titre,
        description: formValues.description,
        type: formValues.type,
        priorite: formValues.priorite,
        datePlanifiee: datePlanifiee,
        contratId: formValues.contratId,
        imprimanteId: formValues.imprimanteId,
        demandeurId: formValues.demandeurId,
        technicienId: formValues.technicienId
      };
      
      this.interventionService.creerTicket(newIntervention).subscribe(
        result => {
          this.showEventForm = false;
          this.loadInterventions();
        },
        error => {
          this.error = `Erreur lors de la création: ${error.message}`;
        }
      );
    }
  }
  
  cancelEvent(): void {
    this.showEventForm = false;
    this.selectedEvent = null;
    this.isEditMode = false;
    this.viewOnly = true;
    this.currentEventId = null;
    
    // Reset the form
    this.eventForm.reset({
      type: TypeIntervention.CORRECTIVE,
      priorite: PrioriteIntervention.NORMALE,
      heurePlanifiee: '08:00',
      duree: 2
    });
  }
  
  enableEdit(): void {
    this.viewOnly = false;
  }
  
  getEventHeaderClass(): string {
    if (!this.selectedEvent || !this.selectedEvent.priorite) {
      return '';
    }
    return `priority-${this.selectedEvent.priorite.toLowerCase()}`;
  }
  
  getInterventionCountByType(type: TypeIntervention | string): number {
    return this.events.filter(e => 
      e.extendedProps && (e.extendedProps as InterventionDTO).type === type
    ).length;
  }
  
  getInterventionCountByStatus(status: StatutIntervention | string): number {
    return this.events.filter(e => 
      e.extendedProps && (e.extendedProps as InterventionDTO).statut === status
    ).length;
  }
  
  // Calendar Actions
  refreshCalendar(): void {
    // Refresh data from the server
    this.loadInterventions();
    this.loadContracts();
  }
  
  exportCalendar(): void {
    // Create an exportable version of the calendar data
    const events = this.events.map(event => {
      // Only include intervention events, not contract expirations
      if (event.extendedProps && !event.extendedProps['isContractExpiration']) {
        const e = event.extendedProps as InterventionDTO;
        return {
          'Titre': event.title,
          'Type': this.formatType(e.type || ''),
          'Priorité': this.formatPriority(e.priorite || ''),
          'Statut': this.formatStatus(e.statut || ''),
          'Date planifiée': e.datePlanifiee ? new Date(e.datePlanifiee).toLocaleDateString() : '',
          'Heure': e.datePlanifiee ? new Date(e.datePlanifiee).toLocaleTimeString() : '',
          'Durée (h)': e.datePlanifiee && e.dateFin ? 
            ((new Date(e.dateFin).getTime() - new Date(e.datePlanifiee).getTime()) / (1000 * 60 * 60)).toFixed(1) : '',
          'Imprimante': e.imprimanteModele || '',
          'Technicien': e.technicienNom || '',
          'Demandeur': e.demandeurNom || '',
          'Contrat': e.contratNumero || ''
        };
      }
      return null;
    }).filter(e => e !== null);
    
    if (events.length === 0) {
      alert('Aucune intervention à exporter.');
      return;
    }
    
    // Convert to CSV
    this.downloadCSV(events as any[], `interventions_${new Date().toISOString().split('T')[0]}.csv`);
  }
  
  downloadCSV(data: any[], filename: string): void {
    // Get headers from the first object
    const headers = Object.keys(data[0]);
    
    // Create CSV content with headers
    let csvContent = headers.join(';') + '\n';
    
    // Add data rows
    data.forEach(item => {
      const row = headers.map(header => {
        // Escape commas and quotes
        const cell = item[header] !== null && item[header] !== undefined ? item[header].toString() : '';
        return `"${cell.replace(/"/g, '""')}"`;
      });
      csvContent += row.join(';') + '\n';
    });
    
    // Create a download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  
  printCalendar(): void {
    if (this.calendarComponent) {
      // Get the calendar container
      const calendarEl = this.calendarComponent.getApi().el;
      
      // Create a print-friendly version
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Veuillez autoriser les fenêtres pop-up pour imprimer le calendrier.');
        return;
      }
      
      // Set up the print window HTML content
      printWindow.document.write(`
        <html>
          <head>
            <title>Calendrier des interventions - ${new Date().toLocaleDateString()}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { color: #1e293b; font-size: 18px; margin-bottom: 15px; }
              .date { color: #64748b; margin-bottom: 20px; }
              table { width: 100%; border-collapse: collapse; margin-top: 15px; }
              th { background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 8px; text-align: left; }
              td { border: 1px solid #e2e8f0; padding: 8px; }
              .priority-critique { border-left: 4px solid #ef4444; }
              .priority-haute { border-left: 4px solid #f59e0b; }
              .priority-normale { border-left: 4px solid #3b82f6; }
              .priority-basse { border-left: 4px solid #10b981; }
              @media print {
                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              }
            </style>
          </head>
          <body>
            <h1>Calendrier des interventions</h1>
            <div class="date">Date d'impression: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</div>
      `);
      
      // Create a table of events sorted by date
      const sortedEvents = [...this.events]
        .filter(e => e.extendedProps && !e.extendedProps['isContractExpiration'])
        .sort((a, b) => {
          // Safely handle date comparison
          const dateA = a.start ? (a.start instanceof Date ? a.start.getTime() : new Date(a.start.toString()).getTime()) : 0;
          const dateB = b.start ? (b.start instanceof Date ? b.start.getTime() : new Date(b.start.toString()).getTime()) : 0;
          return dateA - dateB;
        });
      
      printWindow.document.write(`
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Heure</th>
              <th>Titre</th>
              <th>Type</th>
              <th>Priorité</th>
              <th>Statut</th>
              <th>Technicien</th>
              <th>Client</th>
            </tr>
          </thead>
          <tbody>
      `);
      
      sortedEvents.forEach(event => {
        const e = event.extendedProps as InterventionDTO;
        const startDate = e.datePlanifiee ? new Date(e.datePlanifiee) : null;
        const priorityClass = e.priorite ? `priority-${e.priorite.toLowerCase()}` : '';
        
        printWindow.document.write(`
          <tr class="${priorityClass}">
            <td>${startDate ? startDate.toLocaleDateString() : '-'}</td>
            <td>${startDate ? startDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}</td>
            <td>${event.title}</td>
            <td>${this.formatType(e.type || '')}</td>
            <td>${this.formatPriority(e.priorite || '')}</td>
            <td>${this.formatStatus(e.statut || '')}</td>
            <td>${e.technicienNom || '-'}</td>
            <td>${e.demandeurNom || '-'}</td>
          </tr>
        `);
      });
      
      printWindow.document.write(`
          </tbody>
        </table>
        </body>
        </html>
      `);
      
      printWindow.document.close();
      
      // Wait for content to load before printing
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  }
  
  // Change calendar view (month, week, day, list)
  changeCalendarView(viewName: string): void {
    if (this.calendarComponent) {
      this.calendarComponent.getApi().changeView(viewName);
      this.currentDate = this.calendarComponent.getApi().getDate();
    }
  }
  
  // Get available technicians (filtering out those who are not available)
  getAvailableTechnicians(): Technician[] {
    return this.technicians.filter(tech => tech.disponible);
  }
}
