package com.example.maintenanceapp.ServiceImpl;

import com.example.maintenanceapp.Entity.Contrat;
import com.example.maintenanceapp.Entity.Imprimante;
import com.example.maintenanceapp.Entity.Enum.ImprimanteStatus;
import com.example.maintenanceapp.Repositories.ContratRepositorie;
import com.example.maintenanceapp.Repositories.ImprimanteRepositorie;
import com.example.maintenanceapp.ServiceInterface.IImprimanteService;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;


@Service
@AllArgsConstructor
@Slf4j
public class ImprimanteService implements IImprimanteService {

    private final ImprimanteRepositorie imprimanteRepositorie;
    private final ContratRepositorie contratRepository;
    @Override
    public void importImprimantesFromExcel(MultipartFile file, Long contratId) {
        try (InputStream is = file.getInputStream(); Workbook workbook = new XSSFWorkbook(is)) {
            Sheet sheet = workbook.getSheetAt(0);

            // Fetch the Contrat once
            Contrat contrat = contratRepository.findById(contratId)
                    .orElseThrow(() -> new IllegalArgumentException("Contrat not found with ID: " + contratId));

            for (Row row : sheet) {
                if (row.getRowNum() == 0) continue; // Skip header

                Imprimante imp = new Imprimante();
                
                // Read columns in order: Marque, Modèle, Numéro de série, Emplacement
                if (row.getCell(0) != null) {
                    imp.setMarque(getCellStringValue(row.getCell(0)));
                }
                if (row.getCell(1) != null) {
                    imp.setModele(getCellStringValue(row.getCell(1)));
                }
                if (row.getCell(2) != null) {
                    imp.setNumeroSerie(getCellStringValue(row.getCell(2)));
                }
                if (row.getCell(3) != null) {
                    imp.setEmplacement(getCellStringValue(row.getCell(3)));
                }
                
                imp.setContrat(contrat);

                imprimanteRepositorie.save(imp);
            }

        } catch (IOException e) {
            throw new RuntimeException("Failed to import Excel file", e);
        }
    }

    @Override
    public Imprimante addImprimante(Imprimante imprimante, Long contratId) {
        Contrat contrat = contratRepository.findById(contratId).orElseThrow(null);
        imprimante.setContrat(contrat);

        return imprimanteRepositorie.save(imprimante);
    }

    @Override
    public Imprimante getImprimante(Long imprimanteId) {
        return imprimanteRepositorie.findById(imprimanteId).orElse(null);
    }

    @Override
    public List<Imprimante> getAllImprimante(Long contratId) {
        return imprimanteRepositorie.findByContrat_Id(contratId);
    }

    @Override
    public void deleteImprimante(Long imprimanteId) {
        imprimanteRepositorie.deleteById(imprimanteId);

    }
    @Transactional
    @Override
    public void deleteAllImprimantesByContratId(Long contratId) {
        imprimanteRepositorie.deleteAllByContrat_Id(contratId);
    }

    @Override
    public List<Imprimante> assignImprimantesToContrat(List<Long> imprimanteIds, Long contratId) {
        Contrat contrat = contratRepository.findById(contratId)
                .orElseThrow(() -> new RuntimeException("Contrat not found"));

        List<Imprimante> updated = new ArrayList<>();
        for (Long id : imprimanteIds) {
            Imprimante imp = imprimanteRepositorie.findById(id)
                    .orElseThrow(() -> new RuntimeException("Imprimante ID not found: " + id));
            imp.setContrat(contrat);
            updated.add(imprimanteRepositorie.save(imp));
        }

        return updated;
    }

    // Method is not in the interface, either remove it or add it to the interface
    // Commenting out for now since similar functionality exists in getPrinterStatuses()
    /*
    public Map<Long, String> getImprimanteStatuses(Long contratId) {
        List<Imprimante> imprimantes = imprimanteRepositorie.findByContrat_Id(contratId);
        // This method doesn't exist in the repository
        // List<Intervention> interventions = interventionRepositorie.findByImprimanteIn(imprimantes);

        // Map to hold the latest status of each printer
        Map<Long, String> statusMap = new HashMap<>();

        // The field is named statutIntervention, not statut
        // for (Intervention intervention : interventions) {
        //    Long imprimanteId = intervention.getImprimante().getId();
        //    String statut = intervention.getStatut().name(); // Assuming statut is an enum
        //
        //    // Put the latest status in the map (will overwrite if already present, keeping the latest)
        //    statusMap.put(imprimanteId, statut);
        //}

        return statusMap;
    }
    */
    
    @Override
    public Map<Long, String> getPrinterStatuses() {
        log.debug("Starting getPrinterStatuses() method");
        
        // Get all printers in a single query
        List<Imprimante> allPrinters = imprimanteRepositorie.findAll();
        Map<Long, String> statusMap = new HashMap<>();
        
        // Get the status directly from each printer's status field
        for (Imprimante printer : allPrinters) {
            // Convert enum values to user-friendly strings
            switch (printer.getStatus()) {
                case ACTIF:
                    statusMap.put(printer.getId(), "Actif");
                    break;
                case EN_PANNE:
                    statusMap.put(printer.getId(), "En panne");
                    break;
                case EN_MAINTENANCE:
                    statusMap.put(printer.getId(), "En maintenance");
                    break;
                case HORS_SERVICE:
                    statusMap.put(printer.getId(), "Hors service");
                    break;
                default:
                    statusMap.put(printer.getId(), "Actif"); // Default fallback
            }
        }
        
        log.debug("Finished retrieving printer statuses: {} active, {} en panne, {} maintenance, {} out of service",
            statusMap.values().stream().filter(s -> "Actif".equals(s)).count(),
            statusMap.values().stream().filter(s -> "En panne".equals(s)).count(),
            statusMap.values().stream().filter(s -> "En maintenance".equals(s)).count(),
            statusMap.values().stream().filter(s -> "Hors service".equals(s)).count()
        );
        
        return statusMap;
    }
    
    @Override
    public String getPrinterStatus(Long imprimanteId) {
        log.debug("Getting status for printer ID: {}", imprimanteId);
        
        // Find the printer
        Imprimante printer = imprimanteRepositorie.findById(imprimanteId)
            .orElseThrow(() -> new RuntimeException("Printer not found with ID: " + imprimanteId));
        
        // Get the status directly from the printer entity
        String status;
        switch (printer.getStatus()) {
            case ACTIF:
                status = "Actif";
                break;
            case EN_PANNE:
                status = "En panne";
                break;
            case EN_MAINTENANCE:
                status = "En maintenance";
                break;
            case HORS_SERVICE:
                status = "Hors service";
                break;
            default:
                status = "Actif"; // Default fallback
        }
        
        log.debug("Printer {} has status: {}", imprimanteId, status);
        return status;
    }
    
    @Override
    public List<Imprimante> getAllImprimantes() {
        log.debug("Getting all printers regardless of contract");
        return imprimanteRepositorie.findAll();
    }
    
    @Override
    public void updatePrinterStatus(Long imprimanteId, ImprimanteStatus status) {
        log.debug("Updating printer ID {} status to {}", imprimanteId, status);
        
        Imprimante printer = imprimanteRepositorie.findById(imprimanteId)
            .orElseThrow(() -> new RuntimeException("Printer not found with ID: " + imprimanteId));
        
        ImprimanteStatus oldStatus = printer.getStatus();
        log.info("Changing printer status from {} to {}: ID={}, model={}", 
                oldStatus, status, imprimanteId, printer.getModele());
        
        printer.setStatus(status);
        imprimanteRepositorie.save(printer);
        
        // Verify the update was successful by fetching again
        Imprimante updatedPrinter = imprimanteRepositorie.findById(imprimanteId).orElse(null);
        if (updatedPrinter != null) {
            log.info("Printer status verified after update: ID={}, current status={}, expected status={}", 
                    imprimanteId, updatedPrinter.getStatus(), status);
        } else {
            log.warn("Couldn't verify printer status update: printer with ID={} not found after update", imprimanteId);
        }
        
        log.info("Printer status update process completed: ID={}, status={}", imprimanteId, status);
    }
    
    private String getCellStringValue(Cell cell) {
        if (cell == null) {
            return "";
        }
        
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue().trim();
            case NUMERIC:
                return String.valueOf((long) cell.getNumericCellValue());
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            case FORMULA:
                return cell.getCellFormula();
            default:
                return "";
        }
    }
}
