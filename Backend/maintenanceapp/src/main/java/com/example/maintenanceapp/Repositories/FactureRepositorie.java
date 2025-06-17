package com.example.maintenanceapp.Repositories;

import com.example.maintenanceapp.Entity.Facture;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FactureRepositorie extends JpaRepository<Facture, Long> {
}
