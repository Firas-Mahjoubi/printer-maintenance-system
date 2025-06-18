package com.example.maintenanceapp.ServiceImpl;

import com.example.maintenanceapp.Entity.Utilisateur;
import com.example.maintenanceapp.Repositories.UtilisateurRepositorie;
import com.example.maintenanceapp.ServiceInterface.IUtilisateurService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@AllArgsConstructor
@Slf4j
public class UtilisateurService implements IUtilisateurService {
    private final KeycloakAdminService keycloakAdminService;

    UtilisateurRepositorie utilisateurRepositorie;
    @Override
    public List<Utilisateur> findAll() {
        return List.of();
    }

    @Override
    public Optional<Utilisateur> findById(Long id) {
        return Optional.empty();
    }

    @Override
    public Utilisateur save(Utilisateur utilisateur) {
        return null;
    }

    @Override
    public void delete(Long id) {

    }

    @Override
    public Utilisateur ajouterClient(Utilisateur utilisateur, String password) {
        Utilisateur saved = utilisateurRepositorie.save(utilisateur);
        keycloakAdminService.createClientInKeycloak(saved, password);
        return saved;
    }
}
