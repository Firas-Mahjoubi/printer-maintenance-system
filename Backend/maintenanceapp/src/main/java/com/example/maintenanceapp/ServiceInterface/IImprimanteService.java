package com.example.maintenanceapp.ServiceInterface;

import com.example.maintenanceapp.Entity.Imprimante;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Optional;

public interface IImprimanteService {
    void importImprimantesFromExcel(MultipartFile file,Long contratId) ;
    Imprimante addImprimante(Imprimante imprimante,Long contratId);
    Imprimante getImprimante(Long imprimanteId);
    List<Imprimante> getAllImprimante(Long contratId);
    void deleteImprimante(Long imprimanteId);
    void deleteAllImprimantesByContratId(Long contratId);

}
