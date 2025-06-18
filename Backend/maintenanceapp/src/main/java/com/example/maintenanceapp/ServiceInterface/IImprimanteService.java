package com.example.maintenanceapp.ServiceInterface;

import com.example.maintenanceapp.Entity.Imprimante;

import java.util.List;
import java.util.Optional;

public interface IImprimanteService {
    List<Imprimante> findAll();
    Optional<Imprimante> findById(Long id);
    Imprimante save(Imprimante imprimante);
    void delete(Long id);
}
