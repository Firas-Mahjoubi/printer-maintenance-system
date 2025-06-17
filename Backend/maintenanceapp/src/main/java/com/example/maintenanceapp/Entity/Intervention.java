package com.example.maintenanceapp.Entity;

import com.example.maintenanceapp.Entity.Enum.StatutIntervention;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@ToString
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Intervention {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Setter(AccessLevel.NONE)
    long id;
    String typeProbleme;
    String description;
    LocalDate dateDemande;
    LocalDate dateIntervention;
    @Enumerated(EnumType.STRING)
    StatutIntervention statutIntervention;
    String priorite;
    Double cout;
    @ManyToOne
    private Imprimante imprimante;

    @ManyToOne
    private Utilisateur technicien;
    @OneToOne
    Contrat contrat;
}
