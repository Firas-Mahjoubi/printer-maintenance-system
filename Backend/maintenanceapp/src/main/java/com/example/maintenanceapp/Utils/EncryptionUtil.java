package com.example.maintenanceapp.Utils;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import java.util.Base64;

@Component
public class EncryptionUtil {
    @Value("${encryption.secret}")
    private String secret;

    private SecretKeySpec secretKey;

    @PostConstruct
    public void init() {
        secretKey = new SecretKeySpec(secret.getBytes(), "AES");
    }

    public String encrypt(Long id) {
        try {
            Cipher cipher = Cipher.getInstance("AES/ECB/PKCS5Padding");
            cipher.init(Cipher.ENCRYPT_MODE, secretKey);
            return Base64.getUrlEncoder().encodeToString(cipher.doFinal(id.toString().getBytes()));
        } catch (Exception e) {
            throw new RuntimeException("Error while encrypting ID", e);
        }
    }

    public Long decrypt(String encrypted) {
        try {
            Cipher cipher = Cipher.getInstance("AES/ECB/PKCS5Padding");
            cipher.init(Cipher.DECRYPT_MODE, secretKey);
            byte[] decrypted = cipher.doFinal(Base64.getUrlDecoder().decode(encrypted));
            return Long.parseLong(new String(decrypted));
        } catch (Exception e) {
            throw new RuntimeException("Invalid ID format or decryption failed");
        }
    }
}
