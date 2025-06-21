package com.example.maintenanceapp.Controllers;

import com.example.maintenanceapp.Entity.Enum.Role;
import com.example.maintenanceapp.Entity.Utilisateur;
import com.example.maintenanceapp.ServiceInterface.IUtilisateurService;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@AllArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE)
@RequestMapping("api/Utilisateur")
public class UtilisateurController {
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


    IUtilisateurService utilisateurService;

}
