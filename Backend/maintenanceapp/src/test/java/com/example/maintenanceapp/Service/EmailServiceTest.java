package com.example.maintenanceapp.Service;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Test unitaire pour le service d'envoi d'emails
 */
@SpringBootTest
public class EmailServiceTest {

    @Autowired
    private EmailService emailService;

    @MockBean
    private JavaMailSender emailSender;

    @Test
    public void testSendEmail() {
        // Configuration du mock
        when(emailSender.createMimeMessage()).thenReturn(mock(MimeMessage.class));
        
        // Appel de la méthode à tester
        emailService.sendEmail("test@example.com", "Test Subject", "Test Content");
        
        // Vérification que la méthode send a bien été appelée
        verify(emailSender, times(1)).send(any(SimpleMailMessage.class));
    }
    
    @Test
    public void testSendAccountCreationEmail() {
        // Configuration du mock
        when(emailSender.createMimeMessage()).thenReturn(mock(MimeMessage.class));
        
        // Appel de la méthode à tester
        emailService.sendAccountCreationEmail("test@example.com", "tempPassword123");
        
        // Vérification que la méthode send a bien été appelée
        verify(emailSender, times(1)).send(any(SimpleMailMessage.class));
    }
    
    @Test
    public void testSendHtmlEmail() throws MessagingException {
        // Configuration du mock
        when(emailSender.createMimeMessage()).thenReturn(mock(MimeMessage.class));
        
        // Appel de la méthode à tester
        emailService.sendHtmlEmail("test@example.com", "Test HTML Subject", "<html><body>Test HTML Content</body></html>");
        
        // Vérification que la méthode send a bien été appelée
        verify(emailSender, times(1)).send(any(MimeMessage.class));
    }
    
    @Test
    public void testSendMaintenanceNotificationHtml() throws MessagingException {
        // Configuration du mock
        when(emailSender.createMimeMessage()).thenReturn(mock(MimeMessage.class));
        
        // Appel de la méthode à tester
        emailService.sendMaintenanceNotificationHtml(
            "client@example.com", 
            "Client Test", 
            "CONT-2025-001", 
            LocalDateTime.now().plusMonths(1), 
            123L
        );
        
        // Vérification que la méthode send a bien été appelée
        verify(emailSender, times(1)).send(any(MimeMessage.class));
    }
    
    @Test
    public void testSendAccountCreationHtmlEmail() throws MessagingException {
        // Configuration du mock
        when(emailSender.createMimeMessage()).thenReturn(mock(MimeMessage.class));
        
        // Appel de la méthode à tester
        emailService.sendAccountCreationHtmlEmail(
            "test@example.com", 
            "tempPassword123", 
            "John Doe"
        );
        
        // Vérification que la méthode send a bien été appelée
        verify(emailSender, times(1)).send(any(MimeMessage.class));
    }
}
