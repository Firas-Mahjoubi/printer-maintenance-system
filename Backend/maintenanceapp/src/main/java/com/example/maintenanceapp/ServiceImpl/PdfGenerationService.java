package com.example.maintenanceapp.ServiceImpl;

import com.example.maintenanceapp.Entity.Contrat;
import com.example.maintenanceapp.Entity.Imprimante;
import com.example.maintenanceapp.Entity.Utilisateur;
import com.example.maintenanceapp.Repositories.ImprimanteRepositorie;
import com.itextpdf.html2pdf.HtmlConverter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class PdfGenerationService {

    @Autowired
    private ImprimanteRepositorie imprimanteRepository;

    public byte[] generateContractPdf(Contrat contrat) {
        try {
            String html = generateContractHtml(contrat);
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            HtmlConverter.convertToPdf(html, outputStream);
            return outputStream.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de la génération du PDF: " + e.getMessage(), e);
        }
    }

    private String generateContractHtml(Contrat contrat) {
        StringBuilder htmlBuilder = new StringBuilder();
        
        // Get printers for this contract
        List<Imprimante> imprimantes = imprimanteRepository.findByContrat_Id(contrat.getId());
        
        // CSS Styles
        String css = """
            <style>
                body { 
                    font-family: 'Segoe UI', Arial, sans-serif; 
                    line-height: 1.6; 
                    color: #333; 
                    margin: 0; 
                    background: #f8f9fa; 
                }
                .container { 
                    max-width: 800px; 
                    margin: 20px auto; 
                    background: white; 
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1); 
                    border-radius: 8px; 
                    overflow: hidden; 
                }
                .header { 
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    color: white; 
                    padding: 30px; 
                    text-align: center; 
                }
                .header h1 { 
                    margin: 0; 
                    font-size: 2.2em; 
                    font-weight: 300; 
                }
                .header .company { 
                    font-size: 1.1em; 
                    opacity: 0.9; 
                    margin-top: 10px; 
                }
                .content { 
                    padding: 40px; 
                }
                .section { 
                    margin-bottom: 35px; 
                    background: #f8f9fa; 
                    padding: 25px; 
                    border-radius: 8px; 
                    border-left: 4px solid #667eea; 
                }
                .section h2 { 
                    color: #667eea; 
                    margin-top: 0; 
                    font-size: 1.4em; 
                    display: flex; 
                    align-items: center; 
                }
                .section h2::before { 
                    content: '●'; 
                    margin-right: 10px; 
                    color: #764ba2; 
                }
                .info-grid { 
                    display: grid; 
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
                    gap: 20px; 
                    margin-bottom: 20px; 
                }
                .info-item { 
                    background: white; 
                    padding: 15px; 
                    border-radius: 6px; 
                    border: 1px solid #e9ecef; 
                }
                .info-label { 
                    font-weight: 600; 
                    color: #667eea; 
                    font-size: 0.9em; 
                    text-transform: uppercase; 
                    letter-spacing: 0.5px; 
                }
                .info-value { 
                    font-size: 1.1em; 
                    margin-top: 5px; 
                    word-break: break-word; 
                }
                .status { 
                    display: inline-block; 
                    padding: 6px 12px; 
                    border-radius: 20px; 
                    font-size: 0.9em; 
                    font-weight: 600; 
                    text-transform: uppercase; 
                }
                .status.actif { 
                    background: #d4edda; 
                    color: #155724; 
                }
                .status.expire { 
                    background: #f8d7da; 
                    color: #721c24; 
                }
                .status.en_attente { 
                    background: #fff3cd; 
                    color: #856404; 
                }
                .equipment-list { 
                    background: white; 
                    border-radius: 6px; 
                    overflow: hidden; 
                }
                .equipment-header { 
                    background: #667eea; 
                    color: white; 
                    padding: 15px; 
                    font-weight: 600; 
                }
                .equipment-item { 
                    padding: 15px; 
                    border-bottom: 1px solid #e9ecef; 
                    display: grid; 
                    grid-template-columns: 1fr 1fr 1fr; 
                    gap: 15px; 
                }
                .equipment-item:last-child { 
                    border-bottom: none; 
                }
                .progress-bar { 
                    background: #e9ecef; 
                    border-radius: 10px; 
                    height: 20px; 
                    overflow: hidden; 
                    margin-top: 10px; 
                }
                .progress-fill { 
                    height: 100%; 
                    background: linear-gradient(90deg, #667eea, #764ba2); 
                    transition: width 0.3s ease; 
                }
                .client-avatar { 
                    width: 60px; 
                    height: 60px; 
                    background: #667eea; 
                    border-radius: 50%; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    color: white; 
                    font-size: 24px; 
                    font-weight: bold; 
                    margin-right: 20px; 
                }
                .client-info { 
                    display: flex; 
                    align-items: center; 
                    margin-bottom: 20px; 
                }
                .footer { 
                    background: #343a40; 
                    color: white; 
                    padding: 20px; 
                    text-align: center; 
                    font-size: 0.9em; 
                }
            </style>
            """;

        // Build HTML
        htmlBuilder.append("<!DOCTYPE html><html><head><meta charset='UTF-8'>")
                  .append(css)
                  .append("</head><body>");

        // Header
        htmlBuilder.append("<div class='container'>")
                  .append("<div class='header'>")
                  .append("<h1>Contrat de Maintenance</h1>")
                  .append("<div class='company'>TechMaintenance Solutions</div>")
                  .append("</div>");

        // Content
        htmlBuilder.append("<div class='content'>");

        // Contract Summary Section
        htmlBuilder.append("<div class='section'>")
                  .append("<h2>Résumé du Contrat</h2>")
                  .append("<div class='info-grid'>");
        
        htmlBuilder.append("<div class='info-item'>")
                  .append("<div class='info-label'>Numéro de Contrat</div>")
                  .append("<div class='info-value'>").append(contrat.getNumeroContrat() != null ? contrat.getNumeroContrat() : "N/A").append("</div>")
                  .append("</div>");
        
        htmlBuilder.append("<div class='info-item'>")
                  .append("<div class='info-label'>Date de Début</div>")
                  .append("<div class='info-value'>").append(formatDate(contrat.getDateDebut())).append("</div>")
                  .append("</div>");
        
        htmlBuilder.append("<div class='info-item'>")
                  .append("<div class='info-label'>Date de Fin</div>")
                  .append("<div class='info-value'>").append(formatDate(contrat.getDateFin())).append("</div>")
                  .append("</div>");
        
        htmlBuilder.append("<div class='info-item'>")
                  .append("<div class='info-label'>Statut</div>")
                  .append("<div class='info-value'>")
                  .append("<span class='status ").append(getStatusClass(contrat)).append("'>")
                  .append(getStatusDisplay(contrat))
                  .append("</span></div>")
                  .append("</div>");
        
        htmlBuilder.append("</div></div>");

        // Client Information Section
        if (contrat.getClient() != null) {
            htmlBuilder.append("<div class='section'>")
                      .append("<h2>Informations Client</h2>")
                      .append("<div class='client-info'>")
                      .append("<div class='client-avatar'>")
                      .append(getClientInitials(contrat.getClient()))
                      .append("</div>")
                      .append("<div>")
                      .append("<div style='font-size: 1.2em; font-weight: 600; margin-bottom: 5px;'>")
                      .append(getClientFullName(contrat.getClient()))
                      .append("</div>");
            
            if (contrat.getClient().getEmail() != null) {
                htmlBuilder.append("<div style='color: #667eea; margin-bottom: 3px;'>")
                          .append(contrat.getClient().getEmail())
                          .append("</div>");
            }
            
            if (contrat.getClient().getTelephone() != null) {
                htmlBuilder.append("<div style='color: #6c757d;'>")
                          .append(contrat.getClient().getTelephone())
                          .append("</div>");
            }
            
            htmlBuilder.append("</div></div></div>");
        }

        // Equipment Section
        if (imprimantes != null && !imprimantes.isEmpty()) {
            htmlBuilder.append("<div class='section'>")
                      .append("<h2>Équipements Couverts</h2>")
                      .append("<div class='equipment-list'>")
                      .append("<div class='equipment-header'>")
                      .append("<div>Marque & Modèle</div><div>Numéro de Série</div><div>Emplacement</div>")
                      .append("</div>");
            
            for (Imprimante imprimante : imprimantes) {
                htmlBuilder.append("<div class='equipment-item'>")
                          .append("<div><strong>").append(imprimante.getMarque() != null ? imprimante.getMarque() : "N/A")
                          .append("</strong><br>").append(imprimante.getModele() != null ? imprimante.getModele() : "N/A").append("</div>")
                          .append("<div>").append(imprimante.getNumeroSerie() != null ? imprimante.getNumeroSerie() : "N/A").append("</div>")
                          .append("<div>").append(imprimante.getEmplacement() != null ? imprimante.getEmplacement() : "N/A").append("</div>")
                          .append("</div>");
            }
            
            htmlBuilder.append("</div></div>");
        }

        // Contract Content Section
        if (contrat.getConditions_contrat() != null && !contrat.getConditions_contrat().trim().isEmpty()) {
            htmlBuilder.append("<div class='section'>")
                      .append("<h2>Conditions du Contrat</h2>")
                      .append("<div style='background: white; padding: 20px; border-radius: 6px; border-left: 3px solid #667eea;'>")
                      .append(contrat.getConditions_contrat())
                      .append("</div></div>");
        }

        // Duration and Progress Section
        if (contrat.getDateDebut() != null && contrat.getDateFin() != null) {
            long totalDays = ChronoUnit.DAYS.between(contrat.getDateDebut(), contrat.getDateFin());
            long daysPassed = ChronoUnit.DAYS.between(contrat.getDateDebut(), LocalDate.now());
            double progressPercentage = totalDays > 0 ? Math.min(100.0, Math.max(0.0, (daysPassed * 100.0) / totalDays)) : 0;
            
            htmlBuilder.append("<div class='section'>")
                      .append("<h2>Durée et Progression</h2>")
                      .append("<div class='info-grid'>")
                      .append("<div class='info-item'>")
                      .append("<div class='info-label'>Durée Totale</div>")
                      .append("<div class='info-value'>").append(totalDays).append(" jours</div>")
                      .append("</div>")
                      .append("<div class='info-item'>")
                      .append("<div class='info-label'>Jours Écoulés</div>")
                      .append("<div class='info-value'>").append(Math.max(0, daysPassed)).append(" jours</div>")
                      .append("</div>")
                      .append("</div>")
                      .append("<div style='margin-top: 15px;'>")
                      .append("<div style='font-weight: 600; margin-bottom: 8px;'>Progression: ").append(String.format("%.1f", progressPercentage)).append("%</div>")
                      .append("<div class='progress-bar'>")
                      .append("<div class='progress-fill' style='width: ").append(progressPercentage).append("%;'></div>")
                      .append("</div></div></div>");
        }

        // Service Coverage Section
        htmlBuilder.append("<div class='section'>")
                  .append("<h2>Couverture de Service</h2>")
                  .append("<div class='info-grid'>")
                  .append("<div class='info-item'>")
                  .append("<div class='info-label'>Type de Service</div>")
                  .append("<div class='info-value'>Maintenance Préventive et Corrective</div>")
                  .append("</div>")
                  .append("<div class='info-item'>")
                  .append("<div class='info-label'>Horaires de Service</div>")
                  .append("<div class='info-value'>Lundi - Vendredi, 8h00 - 18h00</div>")
                  .append("</div>")
                  .append("<div class='info-item'>")
                  .append("<div class='info-label'>Support d'Urgence</div>")
                  .append("<div class='info-value'>24/7 pour les pannes critiques</div>")
                  .append("</div>")
                  .append("<div class='info-item'>")
                  .append("<div class='info-label'>Temps de Réponse</div>")
                  .append("<div class='info-value'>4 heures max en jours ouvrés</div>")
                  .append("</div>")
                  .append("</div></div>");

        // Close content and container
        htmlBuilder.append("</div>");

        // Footer
        htmlBuilder.append("<div class='footer'>")
                  .append("Document généré le ").append(LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")))
                  .append(" • TechMaintenance Solutions - Service client: support@techmaintenance.com")
                  .append("</div>");

        htmlBuilder.append("</div></body></html>");

        return htmlBuilder.toString();
    }

    private String formatDate(LocalDate date) {
        if (date == null) return "N/A";
        return date.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
    }

    private String getClientInitials(Utilisateur client) {
        if (client == null) return "??";
        StringBuilder initials = new StringBuilder();
        if (client.getPrenom() != null && !client.getPrenom().isEmpty()) {
            initials.append(client.getPrenom().charAt(0));
        }
        if (client.getNom() != null && !client.getNom().isEmpty()) {
            initials.append(client.getNom().charAt(0));
        }
        return initials.length() > 0 ? initials.toString().toUpperCase() : "??";
    }

    private String getClientFullName(Utilisateur client) {
        if (client == null) return "Client inconnu";
        StringBuilder name = new StringBuilder();
        if (client.getPrenom() != null && !client.getPrenom().isEmpty()) {
            name.append(client.getPrenom());
        }
        if (client.getNom() != null && !client.getNom().isEmpty()) {
            if (name.length() > 0) name.append(" ");
            name.append(client.getNom());
        }
        return name.length() > 0 ? name.toString() : "Client inconnu";
    }

    private String getStatusClass(Contrat contrat) {
        if (contrat.getStatutContrat() == null) return "en_attente";
        return switch (contrat.getStatutContrat().toString().toLowerCase()) {
            case "actif" -> "actif";
            case "expire" -> "expire";
            default -> "en_attente";
        };
    }

    private String getStatusDisplay(Contrat contrat) {
        if (contrat.getStatutContrat() == null) return "En Attente";
        return switch (contrat.getStatutContrat().toString().toLowerCase()) {
            case "actif" -> "Actif";
            case "expire" -> "Expiré";
            default -> "En Attente";
        };
    }
}
