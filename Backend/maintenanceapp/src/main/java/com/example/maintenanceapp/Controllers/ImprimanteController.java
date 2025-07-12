package com.example.maintenanceapp.Controllers;

import com.example.maintenanceapp.Entity.Enum.ImprimanteStatus;
import com.example.maintenanceapp.Entity.Imprimante;
import com.example.maintenanceapp.ServiceInterface.IImprimanteService;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@AllArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE)
@RequestMapping("api/Imprimante")
public class ImprimanteController {
    
    IImprimanteService imprimanteService;
    
    @PostMapping("/import-excel")
    public ResponseEntity<String> importImprimantesFromExcel(@RequestParam MultipartFile file,
                                                             @RequestParam Long contratId) {
        try {
            imprimanteService.importImprimantesFromExcel(file, contratId);
            return ResponseEntity.ok("Imprimantes imported successfully.");
        } catch (Exception e) {
            log.error("Failed to import imprimantes: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Import failed: " + e.getMessage());
        }
    }
@PostMapping("/addImprimante")
    public Imprimante addImprimante(@RequestBody Imprimante imprimante,@RequestParam Long contratId) {
        return imprimanteService.addImprimante(imprimante, contratId);
    }
@GetMapping("/getImprimante")
    public Imprimante getImprimante(@RequestParam Long imprimanteId) {
        return imprimanteService.getImprimante(imprimanteId);
    }
@GetMapping("/getAllImprimante")
    public List<Imprimante> getAllImprimante(@RequestParam Long contratId) {
        return imprimanteService.getAllImprimante(contratId);
    }
@DeleteMapping("/deleteImprimante")
    public void deleteImprimante(@RequestParam Long imprimanteId) {
        imprimanteService.deleteImprimante(imprimanteId);
    }
    @DeleteMapping("/delete-by-contrat/{contratId}")
    public void deleteAllImprimantesByContratId(@PathVariable Long contratId) {
        imprimanteService.deleteAllImprimantesByContratId(contratId);
    }
    @PostMapping("/assign-multiple")
    public List<Imprimante> assignImprimantesToContrat(@RequestParam List<Long> imprimanteIds,@RequestParam Long contratId) {
        return imprimanteService.assignImprimantesToContrat(imprimanteIds, contratId);
    }
    @GetMapping("/status/{imprimanteId}")
    public ResponseEntity<String> getPrinterStatus(@PathVariable Long imprimanteId) {
        try {
            log.debug("Request for printer status with ID: {}", imprimanteId);
            String status = imprimanteService.getPrinterStatus(imprimanteId);
            log.debug("Returned status for printer {}: {}", imprimanteId, status);
            return ResponseEntity.ok(status);
        } catch (Exception e) {
            log.error("Failed to get printer status for ID {}: {}", imprimanteId, e.getMessage());
            return ResponseEntity.badRequest().body("Failed to get status: " + e.getMessage());
        }
    }
    
    @GetMapping("/statuses")
    public ResponseEntity<Map<Long, String>> getAllPrinterStatuses() {
        try {
            log.debug("Request for all printer statuses");
            long startTime = System.currentTimeMillis();
            
            Map<Long, String> statuses = imprimanteService.getPrinterStatuses();
            
            long duration = System.currentTimeMillis() - startTime;
            log.debug("Returned {} printer statuses in {} ms", statuses.size(), duration);
            
            return ResponseEntity.ok(statuses);
        } catch (Exception e) {
            log.error("Failed to get all printer statuses: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(null);
        }
    }
    @GetMapping("/all")
    public List<Imprimante> getAllImprimantes() {
        log.debug("Request to get all printers");
        return imprimanteService.getAllImprimantes();
    }
    
    @PostMapping("/update-status/{imprimanteId}")
    public ResponseEntity<Void> updatePrinterStatus(@PathVariable Long imprimanteId, @RequestBody Map<String, String> payload) {
        try {
            String status = payload.get("status");
            if (status == null) {
                return ResponseEntity.badRequest().build();
            }
            
            ImprimanteStatus imprimanteStatus = ImprimanteStatus.valueOf(status);
            log.info("Updating printer ID {} status to {}", imprimanteId, imprimanteStatus);
            
            imprimanteService.updatePrinterStatus(imprimanteId, imprimanteStatus);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            log.error("Invalid status value provided: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Error updating printer status: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
}
