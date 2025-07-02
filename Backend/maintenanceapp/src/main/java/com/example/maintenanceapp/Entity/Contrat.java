package com.example.maintenanceapp.Entity;

import com.example.maintenanceapp.Entity.Enum.StatutContrat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.util.List;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@ToString
@FieldDefaults(level = AccessLevel.PRIVATE)
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Contrat {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Setter(AccessLevel.NONE)
    long id;
    String numeroContrat;
    LocalDate dateDebut;
    LocalDate dateFin;
    @Enumerated(EnumType.STRING)
    StatutContrat statutContrat;
    String conditions_contrat;
    @ManyToOne
    Utilisateur client;

    @OneToMany(cascade = CascadeType.ALL,mappedBy = "contrat")
    @JsonIgnore
    List<Imprimante> imprimantes;

    @OneToOne(cascade = CascadeType.ALL,mappedBy = "contrat")
     Facture facture;
    @OneToOne
    Intervention intervention;
    @ManyToOne
    Contrat contratPrecedent;

}
