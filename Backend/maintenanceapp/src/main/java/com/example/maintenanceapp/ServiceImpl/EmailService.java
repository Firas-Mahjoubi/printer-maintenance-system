package com.example.maintenanceapp.ServiceImpl;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    // ✅ Constructor injection ensures mailSender is not null
    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendAccountCreationEmail(String toEmail, String tempPassword) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("Your Account Has Been Created");
        message.setText("Welcome! Your temporary password is: " + tempPassword +
                "\nPlease log in and change your password immediately.");

        mailSender.send(message); // ✅ Now this won't be null
    }
}
