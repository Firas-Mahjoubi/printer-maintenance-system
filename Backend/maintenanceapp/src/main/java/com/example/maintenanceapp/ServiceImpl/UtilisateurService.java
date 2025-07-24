package com.example.maintenanceapp.ServiceImpl;

import com.example.maintenanceapp.Entity.Enum.Role;
import com.example.maintenanceapp.Entity.Utilisateur;
import com.example.maintenanceapp.Repositories.UtilisateurRepositorie;
import com.example.maintenanceapp.Service.EmailService;
import com.example.maintenanceapp.ServiceInterface.IUtilisateurService;
import lombok.AllArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@AllArgsConstructor

public class UtilisateurService implements IUtilisateurService {

    UtilisateurRepositorie utilisateurRepositorie;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;



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
    public String generateRandomPassword() {
        return UUID.randomUUID().toString().substring(0, 8);
    }

    @Override
    public Utilisateur addUserWithTempPassword(Utilisateur user) {
        String tempPassword = generateRandomPassword(); // You can define this method
        user.setMotDePasse(passwordEncoder.encode(tempPassword));
        user.setMustResetPassword(true); // Flag to force password reset
        utilisateurRepositorie.save(user);

        emailService.sendAccountCreationEmail(user.getEmail(), tempPassword);

        return user;
    }

    @Override
    public List<Utilisateur> getAllClients() {
        return utilisateurRepositorie.findByRole(Role.CLIENT);
    }


}
