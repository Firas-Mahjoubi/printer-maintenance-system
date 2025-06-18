package com.example.maintenanceapp.ServiceImpl;

import com.example.maintenanceapp.Entity.Utilisateur;
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
}
