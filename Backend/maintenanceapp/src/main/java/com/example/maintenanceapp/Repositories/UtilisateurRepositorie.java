package com.example.maintenanceapp.Repositories;

import com.example.maintenanceapp.Entity.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UtilisateurRepositorie extends JpaRepository<Utilisateur, Long> {
}
