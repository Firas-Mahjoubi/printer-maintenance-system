package com.example.maintenanceapp.Repositories;

import com.example.maintenanceapp.Entity.Intervention;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InterventionRepositorie extends JpaRepository<Intervention, Long> {
}
