package com.example.maintenanceapp.ServiceInterface;

import com.example.maintenanceapp.Entity.Enum.ImprimanteStatus;
import com.example.maintenanceapp.Entity.Imprimante;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface IImprimanteService {
    void importImprimantesFromExcel(MultipartFile file,Long contratId) ;
    Imprimante addImprimante(Imprimante imprimante,Long contratId);
    Imprimante getImprimante(Long imprimanteId);
    List<Imprimante> getAllImprimante(Long contratId);
    List<Imprimante> getAllImprimantes(); // New method to get all printers regardless of contract
    void deleteImprimante(Long imprimanteId);
    void deleteAllImprimantesByContratId(Long contratId);
    List<Imprimante> assignImprimantesToContrat(List<Long> imprimanteIds, Long contratId);
    
    // New method to get status for all printers
    Map<Long, String> getPrinterStatuses();
    
    // New method to get status for a single printer
    String getPrinterStatus(Long imprimanteId);
    
    // Update status for a printer
    void updatePrinterStatus(Long imprimanteId, ImprimanteStatus status);
}
