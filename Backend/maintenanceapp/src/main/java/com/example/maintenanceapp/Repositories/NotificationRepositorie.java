package com.example.maintenanceapp.Repositories;

import com.example.maintenanceapp.Entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificationRepositorie extends JpaRepository<Notification, Long> {
}
