package com.example.maintenanceapp.ServiceImpl;

import com.example.maintenanceapp.Entity.Intervention;
import com.example.maintenanceapp.ServiceInterface.IInterventionService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@AllArgsConstructor
@Slf4j
public class InterventionService implements IInterventionService {
    @Override
    public List<Intervention> findAll() {
        return List.of();
    }

    @Override
    public Optional<Intervention> findById(Long id) {
        return Optional.empty();
    }

    @Override
    public Intervention save(Intervention intervention) {
        return null;
    }

    @Override
    public void delete(Long id) {

    }
}
