package com.example.maintenanceapp.Entity;

import com.example.maintenanceapp.Entity.Enum.Role;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.awt.*;
import java.util.List;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@ToString
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Utilisateur {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    long id;
    String nom;
    String prenom;
    String imageUrl;
    String email;
    String telephone;
    String motDePasse;
    @Enumerated(EnumType.STRING)
    Role role;



    @OneToMany(cascade = CascadeType.ALL, mappedBy="technicien")
    private List<Intervention> interventions;

    @OneToMany(cascade = CascadeType.ALL,mappedBy = "utilisateur")
    private List<Notification> notifications;



}
