package com.example.maintenanceapp.Entity;

import com.example.maintenanceapp.Entity.Enum.StatutFacture;
import com.fasterxml.jackson.annotation.JsonIgnore;

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
public class Facture {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Setter(AccessLevel.NONE)
    long id;
    LocalDate date;
    Double montant;
    @Enumerated(EnumType.STRING)
    StatutFacture statutFacture;

    @OneToOne
        @JsonIgnore
    private Contrat contrat;
}
