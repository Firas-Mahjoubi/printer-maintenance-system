package com.example.maintenanceapp.ServiceImpl.JWT;

import com.example.maintenanceapp.Entity.Utilisateur;
import com.example.maintenanceapp.Repositories.UtilisateurRepositorie;
import lombok.AllArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
@AllArgsConstructor
public class UserServiceImpl implements UserDetailsService {
    private  final UtilisateurRepositorie utilisateurRepositorie;
    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Utilisateur user = utilisateurRepositorie.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getMotDePasse(),
                Collections.emptyList() // Tu peux y ajouter les rôles plus tard
        );
    }

}
