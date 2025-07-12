package com.example.maintenanceapp.Entity;

import com.example.maintenanceapp.Entity.Enum.ImprimanteStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

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
    @JsonIgnore
    private Contrat contrat;

    @OneToMany(mappedBy = "imprimante")
    @JsonIgnore
    @Builder.Default
    private List<Intervention> interventions = new ArrayList<>();
    
    @ManyToMany(mappedBy = "imprimantesAssociees")
    @JsonIgnore
    @Builder.Default
    private List<Intervention> interventionsAssociees = new ArrayList<>();

    // Default printer status (Actif, En maintenance, or Hors service)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ImprimanteStatus status = ImprimanteStatus.ACTIF;
}
