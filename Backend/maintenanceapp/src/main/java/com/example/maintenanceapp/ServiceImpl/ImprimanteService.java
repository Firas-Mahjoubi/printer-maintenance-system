package com.example.maintenanceapp.ServiceImpl;

import com.example.maintenanceapp.Entity.Imprimante;
import com.example.maintenanceapp.ServiceInterface.IImprimanteService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@AllArgsConstructor
@Slf4j
public class ImprimanteService implements IImprimanteService {
    @Override
    public List<Imprimante> findAll() {
        return List.of();
    }

    @Override
    public Optional<Imprimante> findById(Long id) {
        return Optional.empty();
    }

    @Override
    public Imprimante save(Imprimante imprimante) {
        return null;
    }

    @Override
    public void delete(Long id) {

    }
}
