package com.example.maintenanceapp.Controllers;

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
}
