package com.example.maintenanceapp.Entity;

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
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Imprimante {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Setter(AccessLevel.NONE)
    long id;
    String marque;
    String modele;
    String emplacement;
    String numeroSerie;

    @ManyToOne
    private Contrat contrat;

    @OneToMany(mappedBy = "imprimante")
    private List<Intervention> interventions;
}
