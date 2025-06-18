package com.example.maintenanceapp.ServiceInterface;

import com.example.maintenanceapp.Entity.Facture;

import java.util.List;
import java.util.Optional;

public interface IFactureService {
    List<Facture> findAll();
    Optional<Facture> findById(Long id);
    Facture save(Facture facture);
    void delete(Long id);
}
