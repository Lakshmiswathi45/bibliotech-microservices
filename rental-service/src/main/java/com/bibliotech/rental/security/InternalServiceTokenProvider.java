package com.bibliotech.rental.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class InternalServiceTokenProvider {
    @Value("${jwt.secret}")
    private String secret;

    public String createBookServiceToken() {
        SecretKey key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        Date issuedAt = new Date();
        return Jwts.builder()
                .issuer("RENTAL-SERVICE")
                .subject("RENTAL-SERVICE")
                .claim("userId", -1L)
                .claim("role", "SERVICE")
                .issuedAt(issuedAt)
                .expiration(new Date(issuedAt.getTime() + 60_000))
                .signWith(key)
                .compact();
    }
}