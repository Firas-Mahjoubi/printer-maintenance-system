package com.example.maintenanceapp.Controllers;

import com.example.maintenanceapp.Entity.Contrat;
import com.example.maintenanceapp.ServiceInterface.IContratService;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

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

    IContratService contratService;
}
