package com.example.maintenanceapp.Controllers;

import com.example.maintenanceapp.Dto.LoginRequest;
import com.example.maintenanceapp.Repositories.UtilisateurRepositorie;
import com.example.maintenanceapp.ServiceImpl.JWT.UserServiceImpl;
import com.example.maintenanceapp.Utils.JwtUtil;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;

@RestController
@RequestMapping("/login")
@RequiredArgsConstructor
public class LoginController {

    private final AuthenticationManager authenticationManager;
    private final UserServiceImpl userService;
    private final JwtUtil jwtUtil;
    private final UtilisateurRepositorie userRepository;

    @PostMapping
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest, HttpServletResponse response) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getEmail(), loginRequest.getMotDePasse()
                    )
            );
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(HttpServletResponse.SC_FORBIDDEN).body("Incorrect email or password.");
        } catch (DisabledException e) {
            return ResponseEntity.status(HttpServletResponse.SC_FORBIDDEN).body("User is not activated.");
        }

        final UserDetails userDetails = userService.loadUserByUsername(loginRequest.getEmail());
        var user = userRepository.getRolFromUser(userDetails.getUsername());
        final String jwt = jwtUtil.generateToken(
                userDetails.getUsername(),
                user.getRole(),
                user.getId()
        );

        return ResponseEntity.ok(Collections.singletonMap("jwtToken", jwt));
    }
}
