package com.example.maintenanceapp.ServiceImpl;

import com.example.maintenanceapp.Entity.Contrat;
import com.example.maintenanceapp.Entity.Utilisateur;
import com.itextpdf.html2pdf.ConverterProperties;
import com.itextpdf.html2pdf.HtmlConverter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Service
@Slf4j
public class PdfGenerationService {

    public byte[] generateContractPdf(Contrat contrat) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        
        try {
            // Create HTML content
            String htmlContent = generateContractHtml(contrat);
            
            // Convert HTML to PDF
            ConverterProperties converterProperties = new ConverterProperties();
            HtmlConverter.convertToPdf(htmlContent, baos, converterProperties);
            
            log.info("PDF généré avec succès pour le contrat: {}", contrat.getNumeroContrat());
            
        } catch (Exception e) {
            log.error("Erreur lors de la génération du PDF pour le contrat: {}", contrat.getNumeroContrat(), e);
            throw new IOException("Erreur lors de la génération du PDF", e);
        }
        
        return baos.toByteArray();
    }

    private String generateContractHtml(Contrat contrat) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd MMMM yyyy", Locale.FRENCH);
        
        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html>");
        html.append("<html lang='fr'>");
        html.append("<head>");
        html.append("<meta charset='UTF-8'>");
        html.append("<title>Contrat de Maintenance - ").append(contrat.getNumeroContrat()).append("</title>");
        html.append("<style>");
        html.append(getStyles());
        html.append("</style>");
        html.append("</head>");
        html.append("<body>");
        
        // Header
        html.append("<div class='header'>");
        html.append("<h1>CONTRAT DE MAINTENANCE</h1>");
        html.append("<div class='contract-number'>N° ").append(contrat.getNumeroContrat()).append("</div>");
        html.append("</div>");
        
        // Contract Information
        html.append("<div class='section'>");
        html.append("<h2>INFORMATIONS GÉNÉRALES</h2>");
        html.append("<table class='info-table'>");
        html.append("<tr><td class='label'>Numéro de contrat:</td><td class='value'>").append(contrat.getNumeroContrat()).append("</td></tr>");
        html.append("<tr><td class='label'>Date de début:</td><td class='value'>").append(formatDate(contrat.getDateDebut())).append("</td></tr>");
        html.append("<tr><td class='label'>Date de fin:</td><td class='value'>").append(formatDate(contrat.getDateFin())).append("</td></tr>");
        html.append("<tr><td class='label'>Statut:</td><td class='value'>").append(getStatusDisplayText(contrat.getStatutContrat().toString())).append("</td></tr>");
        html.append("<tr><td class='label'>Date de génération:</td><td class='value'>").append(LocalDate.now().format(formatter)).append("</td></tr>");
        html.append("</table>");
        html.append("</div>");
        
        // Client Information
        if (contrat.getClient() != null) {
            Utilisateur client = contrat.getClient();
            html.append("<div class='section'>");
            html.append("<h2>INFORMATIONS CLIENT</h2>");
            html.append("<table class='info-table'>");
            html.append("<tr><td class='label'>Nom:</td><td class='value'>").append(client.getNom() != null ? client.getNom() : "Non spécifié").append("</td></tr>");
            html.append("<tr><td class='label'>ID Client:</td><td class='value'>").append(client.getId()).append("</td></tr>");
            html.append("</table>");
            html.append("</div>");
        }
        
        // Contract Content
        if (contrat.getConditions_contrat() != null && !contrat.getConditions_contrat().isEmpty()) {
            html.append("<div class='section'>");
            html.append("<h2>CONDITIONS DU CONTRAT</h2>");
            html.append("<div class='contract-content'>");
            html.append(contrat.getConditions_contrat());
            html.append("</div>");
            html.append("</div>");
        }
        
        // Duration Information
        html.append("<div class='section'>");
        html.append("<h2>DURÉE ET VALIDITÉ</h2>");
        html.append("<div class='duration-info'>");
        html.append("<p><strong>Durée du contrat:</strong> ").append(calculateDuration(contrat.getDateDebut(), contrat.getDateFin())).append("</p>");
        
        if (contrat.getDateFin().isAfter(LocalDate.now())) {
            long daysRemaining = java.time.temporal.ChronoUnit.DAYS.between(LocalDate.now(), contrat.getDateFin());
            html.append("<p><strong>Jours restants:</strong> ").append(daysRemaining).append(" jours</p>");
        } else {
            html.append("<p><strong>Statut:</strong> <span class='expired'>Contrat expiré</span></p>");
        }
        html.append("</div>");
        html.append("</div>");
        
        // Footer
        html.append("<div class='footer'>");
        html.append("<p>Document généré automatiquement le ").append(LocalDate.now().format(formatter)).append("</p>");
        html.append("<p>Système de Gestion de Maintenance</p>");
        html.append("</div>");
        
        html.append("</body>");
        html.append("</html>");
        
        return html.toString();
    }

    private String getStyles() {
        return """
            body {
                font-family: 'Arial', sans-serif;
                margin: 0;
                padding: 20px;
                line-height: 1.6;
                color: #333;
            }
            
            .header {
                text-align: center;
                border-bottom: 3px solid #2c3e50;
                padding-bottom: 20px;
                margin-bottom: 30px;
            }
            
            .header h1 {
                color: #2c3e50;
                font-size: 28px;
                margin: 0;
                font-weight: bold;
            }
            
            .contract-number {
                font-size: 18px;
                color: #3498db;
                font-weight: bold;
                margin-top: 10px;
            }
            
            .section {
                margin-bottom: 30px;
                page-break-inside: avoid;
            }
            
            .section h2 {
                color: #2c3e50;
                font-size: 18px;
                border-bottom: 2px solid #ecf0f1;
                padding-bottom: 10px;
                margin-bottom: 20px;
            }
            
            .info-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
            }
            
            .info-table td {
                padding: 12px;
                border-bottom: 1px solid #ecf0f1;
            }
            
            .info-table .label {
                background-color: #f8f9fa;
                font-weight: bold;
                width: 200px;
                color: #2c3e50;
            }
            
            .info-table .value {
                color: #555;
            }
            
            .contract-content {
                background-color: #f8f9fa;
                padding: 20px;
                border-radius: 5px;
                border-left: 4px solid #3498db;
            }
            
            .contract-content h1, .contract-content h2, .contract-content h3 {
                color: #2c3e50;
                margin-top: 20px;
                margin-bottom: 10px;
            }
            
            .contract-content p {
                margin-bottom: 15px;
                text-align: justify;
            }
            
            .contract-content ul, .contract-content ol {
                margin-bottom: 15px;
                padding-left: 25px;
            }
            
            .duration-info {
                background-color: #e8f6f3;
                padding: 15px;
                border-radius: 5px;
                border-left: 4px solid #27ae60;
            }
            
            .duration-info p {
                margin: 5px 0;
            }
            
            .expired {
                color: #e74c3c;
                font-weight: bold;
            }
            
            .footer {
                margin-top: 50px;
                text-align: center;
                font-size: 12px;
                color: #7f8c8d;
                border-top: 1px solid #ecf0f1;
                padding-top: 20px;
            }
            
            @page {
                margin: 2cm;
                @bottom-center {
                    content: "Page " counter(page) " sur " counter(pages);
                    font-size: 10px;
                    color: #7f8c8d;
                }
            }
            """;
    }

    private String formatDate(LocalDate date) {
        if (date == null) return "Non spécifié";
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd MMMM yyyy", Locale.FRENCH);
        return date.format(formatter);
    }

    private String calculateDuration(LocalDate startDate, LocalDate endDate) {
        if (startDate == null || endDate == null) return "Durée inconnue";
        
        long days = java.time.temporal.ChronoUnit.DAYS.between(startDate, endDate);
        long months = days / 30;
        
        if (months > 0) {
            return months + " mois (" + days + " jours)";
        } else {
            return days + " jours";
        }
    }

    private String getStatusDisplayText(String status) {
        switch (status.toLowerCase()) {
            case "actif":
                return "Actif";
            case "expire":
                return "Expiré";
            case "suspendu":
                return "Suspendu";
            case "brouillon":
                return "Brouillon";
            case "renouvele":
                return "Renouvelé";
            default:
                return status;
        }
    }
}
