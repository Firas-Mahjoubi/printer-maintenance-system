package com.example.maintenanceapp.ServiceInterface;

import com.example.maintenanceapp.Entity.Intervention;

import java.util.List;
import java.util.Optional;

public interface IInterventionService {
    List<Intervention> findAll();
    Optional<Intervention> findById(Long id);
    Intervention save(Intervention intervention);
    void delete(Long id);
}
