package com.example.maintenanceapp.Repositories;

import com.example.maintenanceapp.Entity.Imprimante;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ImprimanteRepositorie extends JpaRepository<Imprimante, Long> {
    List<Imprimante> findByContrat_Id(Long contratId);
    void deleteAllByContrat_Id(Long contratId);
    List<Imprimante> findByContratId(Long contratId);

}
