package com.example.maintenanceapp.Mapper;

import com.example.maintenanceapp.Dto.ImprimanteDTO;
import com.example.maintenanceapp.Entity.Imprimante;
import org.springframework.stereotype.Component;

@Component
public class ImprimanteMapper {

    public ImprimanteDTO toDTO(Imprimante imprimante) {
        if (imprimante == null) {
            return null;
        }

        ImprimanteDTO dto = new ImprimanteDTO();
        dto.setId(imprimante.getId());
        dto.setMarque(imprimante.getMarque());
        dto.setModele(imprimante.getModele());
        dto.setEmplacement(imprimante.getEmplacement());
        dto.setNumeroSerie(imprimante.getNumeroSerie());
        
        if (imprimante.getContrat() != null) {
            dto.setContratId(imprimante.getContrat().getId());
        }
        
        return dto;
    }
}
