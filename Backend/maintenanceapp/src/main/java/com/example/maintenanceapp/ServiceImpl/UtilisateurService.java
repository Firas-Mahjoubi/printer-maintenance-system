package com.example.maintenanceapp.ServiceImpl;

import com.example.maintenanceapp.Entity.Utilisateur;
import com.example.maintenanceapp.Repositories.UtilisateurRepositorie;
import com.example.maintenanceapp.ServiceInterface.IUtilisateurService;
import lombok.AllArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

@Service
@AllArgsConstructor

public class UtilisateurService implements IUtilisateurService {

    UtilisateurRepositorie utilisateurRepositorie;
    private final PasswordEncoder passwordEncoder;



    @Override
    public List<Utilisateur> retrieveAllUser() {
        return utilisateurRepositorie.findAll();
    }

    @Override
    public Utilisateur addUser(Utilisateur user) {
        user.setMotDePasse(passwordEncoder.encode(user.getMotDePasse()));
        return utilisateurRepositorie.save(user);
    }

    @Override
    public Utilisateur updateUser(Utilisateur user) {
        user.setMotDePasse(passwordEncoder.encode(user.getMotDePasse()));
        return utilisateurRepositorie.save(user);
    }

    @Override
    public void removeUser(Long idUsers) {
        utilisateurRepositorie.deleteById(idUsers);
    }

    @Override
    public Utilisateur getUserById(Long id) {
        return utilisateurRepositorie.findById(id)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with id: " + id));
    }

    @Override
    public Utilisateur getUserByEmail(String email) {
        return utilisateurRepositorie.getRolFromUser(email); // assure-toi que cette méthode renvoie bien un Utilisateur
    }
}
