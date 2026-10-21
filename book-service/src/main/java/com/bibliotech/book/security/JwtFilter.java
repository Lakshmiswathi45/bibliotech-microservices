package com.bibliotech.book.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.*;
import java.nio.charset.StandardCharsets;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class JwtFilter extends OncePerRequestFilter {

    @Value("${jwt.secret}")
    String secret;

    protected void doFilterInternal(
            HttpServletRequest r,
            HttpServletResponse p,
            FilterChain c)
            throws ServletException, IOException {

        String h = r.getHeader("Authorization");

        if (h != null && h.startsWith("Bearer ")) {
            try {
                Claims x = Jwts.parser()
                        .verifyWith(Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8)))
                        .build()
                        .parseSignedClaims(h.substring(7))
                        .getPayload();

                String role = x.get("role", String.class);

                SecurityContextHolder.getContext().setAuthentication(
                        new UsernamePasswordAuthenticationToken(
                                x.getSubject(),
                                null,
                                java.util.List.of(
                                        new SimpleGrantedAuthority("ROLE_" + role)
                                )
                        )
                );

            } catch (Exception e) {
                                e.printStackTrace();
            }
        }

        c.doFilter(r, p);
    }
}