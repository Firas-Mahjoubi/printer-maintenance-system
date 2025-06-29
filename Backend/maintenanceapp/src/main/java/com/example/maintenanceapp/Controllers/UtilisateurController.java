package com.example.maintenanceapp.Controllers;

import com.example.maintenanceapp.Entity.Enum.Role;
import com.example.maintenanceapp.Entity.Utilisateur;
import com.example.maintenanceapp.Repositories.UtilisateurRepositorie;
import com.example.maintenanceapp.ServiceInterface.IUtilisateurService;
import com.example.maintenanceapp.config.WebSecurityConfiguration;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@AllArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE)
@RequestMapping("api/Utilisateur")
public class UtilisateurController {
    UtilisateurRepositorie utilisateurRepositorie;
    @GetMapping("/getallUser")
    public List<Utilisateur> retrieveAllUser() {
        return utilisateurService.retrieveAllUser();
    }


    @PostMapping("/add")
    public Utilisateur addUser(@RequestBody Utilisateur user) {
        return utilisateurService.addUser(user);
    }
    @PutMapping("/update")
    public Utilisateur updateUser(@RequestBody Utilisateur user) {
        return utilisateurService.updateUser(user);
    }
    @DeleteMapping("/delete/{idUsers}")
    public void removeUser(@PathVariable Long idUsers) {
        utilisateurService.removeUser(idUsers);
    }
    @GetMapping("/getbyid/{id}")
    public Utilisateur getUserById(@PathVariable Long id) {
        return utilisateurService.getUserById(id);
    }
    @GetMapping("/getbyemail/{email}")
    public Utilisateur getUserByEmail(@PathVariable String email) {
        return utilisateurService.getUserByEmail(email);
    }
    @PostMapping("/add-admin")
    public Utilisateur addAdmin(@RequestBody Utilisateur user) {
        user.setRole(Role.ADMIN); // set role manually
        return utilisateurService.addUser(user);
    }
    WebSecurityConfiguration webSecurityConfiguration;
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestParam String newPassword, Principal principal) {
        Utilisateur user = utilisateurRepositorie.findByEmail(principal.getName()).orElseThrow();
        user.setMotDePasse(webSecurityConfiguration.passwordEncoder().encode(newPassword));
        user.setMustResetPassword(false);
        utilisateurRepositorie.save(user);
        return ResponseEntity.ok("Password updated.");
    }

    @PostMapping("/addUserWithTempPassword")
    public Utilisateur addUserWithTempPassword(@RequestBody Utilisateur user) {
        return utilisateurService.addUserWithTempPassword(user);
    }
@GetMapping("/getAllClients")
    public List<Utilisateur> getAllClients() {
        return utilisateurService.getAllClients();
    }

    IUtilisateurService utilisateurService;

}
