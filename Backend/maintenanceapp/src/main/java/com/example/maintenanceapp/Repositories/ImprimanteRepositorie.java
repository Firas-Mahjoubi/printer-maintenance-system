package com.example.maintenanceapp.Repositories;

import com.example.maintenanceapp.Entity.Imprimante;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ImprimanteRepositorie extends JpaRepository<Imprimante, Long> {
}
