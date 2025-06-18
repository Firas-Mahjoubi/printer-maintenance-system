package com.example.maintenanceapp.ServiceInterface;

import com.example.maintenanceapp.Entity.Utilisateur;

import java.util.List;
import java.util.Optional;

public interface IUtilisateurService {
    List<Utilisateur> findAll();
    Optional<Utilisateur> findById(Long id);
    Utilisateur save(Utilisateur utilisateur);
    void delete(Long id);
    Utilisateur ajouterClient(Utilisateur utilisateur, String password);
}
