package com.example.maintenanceapp.Service;

import com.example.maintenanceapp.Entity.Contrat;
import com.example.maintenanceapp.Entity.Enum.StatutContrat;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.lang.reflect.Method;
import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class MaintenanceSchedulerServiceTest {

    @Mock
    private EmailService emailService;

    @InjectMocks
    private MaintenanceSchedulerService maintenanceSchedulerService;

    @Test
    public void testCalculateNextMaintenanceDate() throws Exception {
        // Utiliser la réflexion pour accéder à la méthode privée
        Method calculateMethod = MaintenanceSchedulerService.class.getDeclaredMethod(
                "calculateNextMaintenanceDate", Contrat.class);
        calculateMethod.setAccessible(true);

        // Créer un contrat de test
        Contrat contrat = new Contrat();
        contrat.setNumeroContrat("TEST-2023-001");
        
        // Cas 1: Contrat sans date de début
        contrat.setDateDebut(null);
        LocalDateTime result1 = (LocalDateTime) calculateMethod.invoke(maintenanceSchedulerService, contrat);
        assertNotNull(result1);
        // Vérifie que la date calculée est dans environ 6 mois
        assertTrue(result1.isAfter(LocalDateTime.now().plusMonths(5)));
        assertTrue(result1.isBefore(LocalDateTime.now().plusMonths(7)));
        
        // Cas 2: Contrat débuté il y a 2 mois
        LocalDate twoMonthsAgo = LocalDate.now().minusMonths(2);
        contrat.setDateDebut(twoMonthsAgo);
        LocalDateTime result2 = (LocalDateTime) calculateMethod.invoke(maintenanceSchedulerService, contrat);
        assertNotNull(result2);
        // Vérifie que la date est dans environ 4 mois (6 - 2 = 4)
        assertTrue(result2.isAfter(twoMonthsAgo.plusMonths(5).atStartOfDay()));
        assertTrue(result2.isBefore(twoMonthsAgo.plusMonths(7).atStartOfDay()));
        
        // Cas 3: Contrat débuté il y a 7 mois
        LocalDate sevenMonthsAgo = LocalDate.now().minusMonths(7);
        contrat.setDateDebut(sevenMonthsAgo);
        LocalDateTime result3 = (LocalDateTime) calculateMethod.invoke(maintenanceSchedulerService, contrat);
        assertNotNull(result3);
        // Vérifie que la date est dans environ 5 mois (12 - 7 = 5)
        assertTrue(result3.isAfter(sevenMonthsAgo.plusMonths(11).atStartOfDay()));
        assertTrue(result3.isBefore(sevenMonthsAgo.plusMonths(13).atStartOfDay()));
    }
}
