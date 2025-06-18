package com.example.maintenanceapp.ServiceImpl;
import com.example.maintenanceapp.Entity.Utilisateur;
import jakarta.ws.rs.core.Response;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.KeycloakBuilder;
import org.keycloak.representations.idm.UserRepresentation;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.RoleRepresentation;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class KeycloakAdminService {
    @Value("${keycloak.auth-server-url}")
    private String keycloakServerUrl;

    @Value("${keycloak.realm}")
    private String realm;

    @Value("${keycloak.resource}")
    private String clientId;

    @Value("${keycloak.credentials.secret}")
    private String clientSecret;

    private Keycloak getKeycloakInstance() {
        return KeycloakBuilder.builder()
                .serverUrl(keycloakServerUrl)
                .realm("master") // authentification dans le master realm pour gestion admin
                .clientId("admin-cli")
                .username("admin") // admin Keycloak
                .password("admin") // mot de passe admin
                .build();
    }

    public void createClientInKeycloak(Utilisateur utilisateur, String password) {
        Keycloak keycloak = getKeycloakInstance();

        UserRepresentation user = new UserRepresentation();
        user.setUsername(utilisateur.getEmail());
        user.setEmail(utilisateur.getEmail());
        user.setFirstName(utilisateur.getNom());
        user.setLastName(utilisateur.getPrenom());
        user.setEnabled(true);
        user.setEmailVerified(true);

        // Création de l'utilisateur
        Response response = keycloak.realm(realm).users().create(user);
        if (response.getStatus() != 201) {
            throw new RuntimeException("Échec de création utilisateur dans Keycloak: " + response.getStatus());
        }

        String userId = response.getLocation().getPath().replaceAll(".*/([^/]+)$", "$1");

        // Définir mot de passe
        CredentialRepresentation credential = new CredentialRepresentation();
        credential.setTemporary(false);
        credential.setType(CredentialRepresentation.PASSWORD);
        credential.setValue(password);

        keycloak.realm(realm).users().get(userId).resetPassword(credential);

        // Affecter rôle CLIENT
        RoleRepresentation clientRole = keycloak.realm(realm).roles().get("CLIENT").toRepresentation();
        keycloak.realm(realm).users().get(userId).roles().realmLevel().add(List.of(clientRole));
    }

}
