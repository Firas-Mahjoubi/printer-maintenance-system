package com.example.maintenanceapp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class MaintenanceappApplication {

    public static void main(String[] args) {
        SpringApplication.run(MaintenanceappApplication.class, args);
    }

}
