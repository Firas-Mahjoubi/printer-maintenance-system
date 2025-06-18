package com.example.maintenanceapp.ServiceImpl;

import com.example.maintenanceapp.Entity.Notification;
import com.example.maintenanceapp.ServiceInterface.INotificationService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@AllArgsConstructor
@Slf4j
public class NotificationService implements INotificationService {
    @Override
    public List<Notification> findAll() {
        return List.of();
    }

    @Override
    public Optional<Notification> findById(Long id) {
        return Optional.empty();
    }

    @Override
    public Notification save(Notification notification) {
        return null;
    }

    @Override
    public void delete(Long id) {

    }
}
