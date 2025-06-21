package com.example.maintenanceapp.ServiceInterface;

import com.example.maintenanceapp.Entity.Utilisateur;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.List;
import java.util.Optional;

public interface IUtilisateurService {


    List<Utilisateur> retrieveAllUser();
    Utilisateur addUser(Utilisateur user);
    Utilisateur updateUser(Utilisateur user);
    void removeUser(Long idUsers);

    Utilisateur getUserById(Long id);

    Utilisateur getUserByEmail(String email);


}
