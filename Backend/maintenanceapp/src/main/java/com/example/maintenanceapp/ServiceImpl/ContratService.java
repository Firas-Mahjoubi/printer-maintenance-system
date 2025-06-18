package com.example.maintenanceapp.ServiceImpl;

import com.example.maintenanceapp.Entity.Contrat;
import com.example.maintenanceapp.Repositories.ContratRepositorie;
import com.example.maintenanceapp.ServiceInterface.IContratService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@AllArgsConstructor
@Slf4j
public class ContratService implements IContratService {
    ContratRepositorie contratRepositorie;
    @Override
    public List<Contrat> findAll() {
        return contratRepositorie.findAll();
    }

    @Override
    public Contrat findById(Long id) {
        return contratRepositorie.findById(id).orElse(null);
    }

    @Override
    public Contrat save(Contrat contrat) {
        return contratRepositorie.save(contrat);
    }

    @Override
    public void delete(Long id) {
        contratRepositorie.deleteById(id);

    }

    @Override
    public Contrat update(long id, Contrat contrat) {
        Contrat existing = contratRepositorie.findById(id).orElse(null);
        existing.setNumeroContrat(contrat.getNumeroContrat());
        existing.setDateDebut(contrat.getDateDebut());
        existing.setDateFin(contrat.getDateFin());
        existing.setStatutContrat(contrat.getStatutContrat());


        return contratRepositorie.save(existing);
    }
}
