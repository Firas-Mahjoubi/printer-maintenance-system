package com.example.maintenanceapp.Repositories;

import com.example.maintenanceapp.Entity.Contrat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository

public interface ContratRepositorie extends JpaRepository<Contrat, Long> {
}
