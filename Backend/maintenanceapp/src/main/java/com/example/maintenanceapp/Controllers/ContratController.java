package com.example.maintenanceapp.Controllers;

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
    public Contrat save(@RequestBody Contrat contrat,@PathVariable long clientId) {
        return contratService.save(contrat,clientId);
    }
@GetMapping("/findAll")
    public List<Contrat> findAll() {
        return contratService.findAll();
    }
@PostMapping("/delete/{id}")
    public void delete(@PathVariable Long id) {
        contratService.delete(id);
    }
@GetMapping("/findById/{id}")
    public Contrat findById(@PathVariable Long id) {
        return contratService.findById(id);
    }
@PutMapping("/update/{id}")
    public Contrat update(@PathVariable long id,@RequestBody Contrat contrat) {
        return contratService.update(id, contrat);
    }
   /* @PutMapping("/update/{encryptedId}")
    public Contrat update(@PathVariable String encryptedId,@RequestBody Contrat contrat) {
        Long id = encryptionUtil.decrypt(encryptedId);
        return contratService.update(id, contrat);
    }*/

    @PostMapping("/renouveler/{id}")
    public Contrat renouvelerContrat(@PathVariable Long id,@RequestBody Contrat newContratData) {
        return contratService.renouvelerContrat(id, newContratData);
    }
@GetMapping("/getContratsHistorie")
    public List<Contrat> getContratsHistorie() {
        return contratService.getContratsHistorie();
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

    IContratService contratService;
}
