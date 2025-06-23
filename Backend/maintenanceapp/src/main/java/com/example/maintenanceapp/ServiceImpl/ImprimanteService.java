package com.example.maintenanceapp.ServiceImpl;

import com.example.maintenanceapp.Entity.Contrat;
import com.example.maintenanceapp.Entity.Imprimante;
import com.example.maintenanceapp.Repositories.ContratRepositorie;
import com.example.maintenanceapp.Repositories.ImprimanteRepositorie;
import com.example.maintenanceapp.ServiceInterface.IImprimanteService;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;


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
                imp.setEmplacement(row.getCell(0).getStringCellValue());
                imp.setMarque(row.getCell(1).getStringCellValue());
                imp.setModele(row.getCell(2).getStringCellValue());
                imp.setNumeroSerie(row.getCell(3).getStringCellValue());
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
}
