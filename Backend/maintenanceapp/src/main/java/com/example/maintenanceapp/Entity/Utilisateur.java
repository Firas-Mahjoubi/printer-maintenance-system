package com.example.maintenanceapp.Entity;

import com.example.maintenanceapp.Entity.Enum.Role;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@ToString
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
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
    @Column(name = "must_reset_password")
    boolean mustResetPassword;




    @OneToMany(cascade = CascadeType.ALL, mappedBy="technicien")
    @JsonIgnore
    private List<Intervention> interventions;

    @OneToMany(cascade = CascadeType.ALL,mappedBy = "utilisateur")
    @JsonIgnore
    private List<Notification> notifications;



}
