package com.example.maintenanceapp.Repositories;

import com.example.maintenanceapp.Entity.Enum.Role;
import com.example.maintenanceapp.Entity.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UtilisateurRepositorie extends JpaRepository<Utilisateur, Long> {
    Optional<Utilisateur> findByEmail(String email);
    boolean existsByEmail(String email);
    @Query ("select c from Utilisateur c where c.email=:mail")
    Utilisateur getRolFromUser (@Param("mail") String mail);
    List<Utilisateur> findByRole(Role role);
}
