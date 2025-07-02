package com.example.maintenanceapp.Controllers;

import com.example.maintenanceapp.Dto.ContratDTO;
import com.example.maintenanceapp.Entity.Contrat;
import com.example.maintenanceapp.ServiceInterface.IContratService;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;

@RestController
@AllArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE)
@RequestMapping("api/Contrat")
public class ContratController {

    @PostMapping("/save/{clientId}")
    public ResponseEntity<ContratDTO> save(@RequestBody Contrat contrat,@PathVariable long clientId) {
        try {
            Contrat savedContrat = contratService.save(contrat,clientId);
            ContratDTO contratDTO = convertToDTO(savedContrat);
            return ResponseEntity.ok(contratDTO);
        } catch (Exception e) {
            log.error("Erreur lors de la création du contrat: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
@GetMapping("/findAll")
    public List<ContratDTO> findAll() {
        List<Contrat> contrats = contratService.findAll();
        return contrats.stream()
                .map(this::convertToDTO)
                .toList();
    }
@PostMapping("/delete/{id}")
    public void delete(@PathVariable Long id) {
        contratService.delete(id);
    }
@GetMapping("/findById/{id}")
    public ContratDTO findById(@PathVariable Long id) {
        Contrat contrat = contratService.findById(id);
        return convertToDTO(contrat);
    }
@PutMapping("/update/{id}")
    public ContratDTO update(@PathVariable long id,@RequestBody Contrat contrat) {
        Contrat updatedContrat = contratService.update(id, contrat);
        return convertToDTO(updatedContrat);
    }
   /* @PutMapping("/update/{encryptedId}")
    public Contrat update(@PathVariable String encryptedId,@RequestBody Contrat contrat) {
        Long id = encryptionUtil.decrypt(encryptedId);
        return contratService.update(id, contrat);
    }*/

    @PostMapping("/renouveler/{id}")
    public ContratDTO renouvelerContrat(@PathVariable Long id,@RequestBody Contrat newContratData) {
        Contrat renewedContrat = contratService.renouvelerContrat(id, newContratData);
        return convertToDTO(renewedContrat);
    }
@GetMapping("/getContratsHistorie")
    public List<ContratDTO> getContratsHistorie() {
        List<Contrat> contrats = contratService.getContratsHistorie();
        return contrats.stream()
                .map(this::convertToDTO)
                .toList();
    }

    @GetMapping("/export/pdf/{id}")
    public ResponseEntity<byte[]> exportContratToPdf(@PathVariable Long id) {
        try {
            byte[] pdfContent = contratService.exportContratToPdf(id);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "contrat-" + id + ".pdf");
            headers.setContentLength(pdfContent.length);
            
            return new ResponseEntity<>(pdfContent, headers, HttpStatus.OK);
            
        } catch (IOException e) {
            log.error("Erreur lors de l'export PDF du contrat {}: {}", id, e.getMessage());
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        } catch (RuntimeException e) {
            log.error("Contrat non trouvé pour l'ID {}: {}", id, e.getMessage());
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @GetMapping("/checkNumeroContratExists/{numeroContrat}")
    public ResponseEntity<Boolean> checkNumeroContratExists(@PathVariable String numeroContrat) {
        try {
            boolean exists = contratService.checkNumeroContratExists(numeroContrat);
            return ResponseEntity.ok(exists);
        } catch (Exception e) {
            log.error("Erreur lors de la vérification du numéro de contrat: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Helper method to convert Contrat entity to ContratDTO
    private ContratDTO convertToDTO(Contrat contrat) {
        if (contrat == null) {
            return null;
        }
        
        return ContratDTO.builder()
                .id(contrat.getId())
                .numeroContrat(contrat.getNumeroContrat())
                .dateDebut(contrat.getDateDebut())
                .dateFin(contrat.getDateFin())
                .statutContrat(contrat.getStatutContrat())
                .conditions_contrat(contrat.getConditions_contrat())
                .client(contrat.getClient() != null ? 
                    ContratDTO.ClientDTO.builder()
                        .id(contrat.getClient().getId())
                        .nom(contrat.getClient().getNom())
                        .prenom(contrat.getClient().getPrenom())
                        .email(contrat.getClient().getEmail())
                        .telephone(contrat.getClient().getTelephone())
                        .build() : null)
                .build();
    }

    IContratService contratService;
}
