package com.example.maintenanceapp.ServiceInterface;

import com.example.maintenanceapp.Entity.Notification;

import java.util.List;
import java.util.Optional;

public interface INotificationService {
    List<Notification> findAll();
    Optional<Notification> findById(Long id);
    Notification save(Notification notification);
    void delete(Long id);
}
