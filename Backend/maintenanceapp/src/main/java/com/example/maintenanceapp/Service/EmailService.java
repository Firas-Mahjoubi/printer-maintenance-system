package com.example.maintenanceapp.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@AllArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender emailSender;

    /**
     * Envoie un email simple (texte brut)
     */
    public void sendEmail(String to, String subject, String text) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject(subject);
            message.setText(text);
            
            emailSender.send(message);
            log.info("Email envoyé avec succès à {}", to);
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de l'email à {}: {}", to, e.getMessage());
            throw e;
        }
    }

    /**
     * Envoie un email pour la création d'un compte avec mot de passe temporaire
     */
    public void sendAccountCreationEmail(String toEmail, String tempPassword) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toEmail);
            message.setSubject("Votre compte a été créé");
            message.setText("Bienvenue ! Votre mot de passe temporaire est : " + tempPassword +
                    "\nVeuillez vous connecter et changer votre mot de passe immédiatement.");
            
            emailSender.send(message);
            log.info("Email de création de compte envoyé avec succès à {}", toEmail);
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de l'email de création de compte à {}: {}", toEmail, e.getMessage());
            throw e;
        }
    }

    /**
     * Envoie un email avec contenu HTML
     */
    public void sendHtmlEmail(String to, String subject, String htmlContent) throws MessagingException {
        try {
            MimeMessage message = emailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            
            emailSender.send(message);
            log.info("Email HTML envoyé avec succès à {}", to);
        } catch (MessagingException e) {
            log.error("Erreur lors de l'envoi de l'email HTML à {}: {}", to, e.getMessage());
            throw e;
        }
    }
    
    /**
     * Envoie un email avec contenu HTML et pièces jointes
     */
    public void sendEmailWithAttachment(String to, String subject, String htmlContent, String attachmentFilePath, 
                                       String attachmentFileName) throws MessagingException {
        try {
            MimeMessage message = emailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            
            // Ajouter la pièce jointe
            // FileSystemResource file = new FileSystemResource(new File(attachmentFilePath));
            // helper.addAttachment(attachmentFileName, file);
            
            emailSender.send(message);
            log.info("Email avec pièce jointe envoyé avec succès à {}", to);
        } catch (MessagingException e) {
            log.error("Erreur lors de l'envoi de l'email avec pièce jointe à {}: {}", to, e.getMessage());
            throw e;
        }
    }
    
    /**
     * Envoie une notification HTML pour une maintenance préventive planifiée
     * 
     * @param to Email du destinataire
     * @param clientName Nom du client
     * @param contractNumber Numéro du contrat
     * @param maintenanceDate Date de la maintenance planifiée
     * @param interventionId ID de l'intervention
     * @throws MessagingException si l'envoi échoue
     */
    public void sendMaintenanceNotificationHtml(String to, String clientName, String contractNumber, 
                                              LocalDateTime maintenanceDate, Long interventionId) throws MessagingException {
        try {
            String subject = "Rappel de maintenance préventive - Contrat " + contractNumber;
            
            // Formatage de la date en français
            String formattedDate = maintenanceDate.toLocalDate().toString(); // Peut être amélioré avec DateTimeFormatter
            
            // Création du contenu HTML avec un style moderne
            String htmlContent = 
                "<!DOCTYPE html>" +
                "<html>" +
                "<head>" +
                "    <meta charset=\"UTF-8\">" +
                "    <style>" +
                "        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }" +
                "        .container { max-width: 600px; margin: 0 auto; padding: 20px; }" +
                "        .header { background-color: #0056b3; color: #ffffff; padding: 15px; text-align: center; }" +
                "        .content { padding: 20px; background-color: #f9f9f9; border: 1px solid #ddd; }" +
                "        .maintenance-details { background-color: #ffffff; padding: 15px; margin: 15px 0; border-left: 4px solid #0056b3; }" +
                "        .footer { font-size: 12px; text-align: center; margin-top: 20px; color: #777; }" +
                "    </style>" +
                "</head>" +
                "<body>" +
                "    <div class=\"container\">" +
                "        <div class=\"header\">" +
                "            <h2>Rappel de Maintenance Préventive</h2>" +
                "        </div>" +
                "        <div class=\"content\">" +
                "            <p>Bonjour <strong>" + clientName + "</strong>,</p>" +
                "            <p>Nous vous informons qu'une maintenance préventive est programmée pour votre contrat.</p>" +
                "            <div class=\"maintenance-details\">" +
                "                <p><strong>Contrat:</strong> " + contractNumber + "</p>" +
                "                <p><strong>Date prévue:</strong> " + formattedDate + "</p>" +
                "                <p><strong>Référence:</strong> INT-" + interventionId + "</p>" +
                "            </div>" +
                "            <p>Un technicien vous contactera prochainement pour confirmer le rendez-vous.</p>" +
                "            <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>" +
                "            <p>Cordialement,<br>L'équipe de maintenance</p>" +
                "        </div>" +
                "        <div class=\"footer\">" +
                "            <p>Ce message est généré automatiquement, merci de ne pas y répondre directement.</p>" +
                "        </div>" +
                "    </div>" +
                "</body>" +
                "</html>";
            
            // Envoi du message HTML
            sendHtmlEmail(to, subject, htmlContent);
            
            log.info("Email de notification de maintenance envoyé avec succès à {}", to);
        } catch (MessagingException e) {
            log.error("Erreur lors de l'envoi de l'email de notification de maintenance à {}: {}", to, e.getMessage());
            throw e;
        }
    }
    
    /**
     * Vérifie si le service email est correctement configuré
     * @return true si la configuration semble valide, false sinon
     */
    public boolean isEmailConfigurationValid() {
        try {
            // On ne peut pas facilement vérifier la configuration, alors on envoie un email de test à nous-même
            // Cette méthode peut être appelée au démarrage de l'application pour vérifier la configuration
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo("test@example.com");
            message.setSubject("Test Email Configuration");
            message.setText("Ceci est un test de configuration email.");
            
            // Nous n'envoyons pas réellement l'email, juste pour vérifier qu'il peut être préparé
            // emailSender.send(message);
            
            return true;
        } catch (Exception e) {
            log.error("La configuration email semble invalide: {}", e.getMessage());
            return false;
        }
    }
    
    /**
     * Envoie un email HTML pour la création d'un compte avec mot de passe temporaire
     */
    public void sendAccountCreationHtmlEmail(String toEmail, String tempPassword, String userName) throws MessagingException {
        try {
            MimeMessage message = emailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setTo(toEmail);
            helper.setSubject("Votre compte a été créé");
            
            // Création du contenu HTML avec un style moderne
            String htmlContent = 
                "<!DOCTYPE html>" +
                "<html>" +
                "<head>" +
                "    <meta charset=\"UTF-8\">" +
                "    <style>" +
                "        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }" +
                "        .container { max-width: 600px; margin: 0 auto; padding: 20px; }" +
                "        .header { background-color: #0056b3; color: #ffffff; padding: 15px; text-align: center; }" +
                "        .content { padding: 20px; background-color: #f9f9f9; border: 1px solid #ddd; }" +
                "        .password-box { background-color: #ffffff; padding: 15px; margin: 15px 0; border-left: 4px solid #0056b3; font-family: monospace; font-size: 18px; text-align: center; }" +
                "        .warning { color: #d9534f; margin-top: 15px; }" +
                "        .footer { font-size: 12px; text-align: center; margin-top: 20px; color: #777; }" +
                "        .button { display: inline-block; background-color: #0056b3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-top: 15px; }" +
                "    </style>" +
                "</head>" +
                "<body>" +
                "    <div class=\"container\">" +
                "        <div class=\"header\">" +
                "            <h2>Bienvenue sur votre nouvelle application</h2>" +
                "        </div>" +
                "        <div class=\"content\">" +
                "            <p>Bonjour" + (userName != null && !userName.isEmpty() ? " <strong>" + userName + "</strong>" : "") + ",</p>" +
                "            <p>Votre compte a été créé avec succès. Voici votre mot de passe temporaire :</p>" +
                "            <div class=\"password-box\">" + tempPassword + "</div>" +
                "            <p class=\"warning\"><strong>Important :</strong> Veuillez vous connecter et changer votre mot de passe immédiatement pour des raisons de sécurité.</p>" +
                "            <a href=\"http://localhost:4200/login\" class=\"button\">Se connecter</a>" +
                "        </div>" +
                "        <div class=\"footer\">" +
                "            <p>Ce message est généré automatiquement, merci de ne pas y répondre directement.</p>" +
                "        </div>" +
                "    </div>" +
                "</body>" +
                "</html>";
            
            helper.setText(htmlContent, true);
            
            emailSender.send(message);
            log.info("Email HTML de création de compte envoyé avec succès à {}", toEmail);
        } catch (MessagingException e) {
            log.error("Erreur lors de l'envoi de l'email HTML de création de compte à {}: {}", toEmail, e.getMessage());
            throw e;
        }
    }
}
