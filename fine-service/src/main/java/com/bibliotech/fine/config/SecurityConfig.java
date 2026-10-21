package com.bibliotech.fine.config;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.*;
import java.nio.charset.StandardCharsets;

import org.springframework.beans.factory.annotation.*;
import org.springframework.context.annotation.*;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.*;
import org.springframework.security.config.annotation.web.builders.*;
import org.springframework.security.config.http.*;
import org.springframework.security.core.authority.*;
import org.springframework.security.core.context.*;
import org.springframework.security.web.*;
import org.springframework.security.web.authentication.*;
import org.springframework.stereotype.*;
import org.springframework.web.filter.*;

@Component
class JwtFilter extends OncePerRequestFilter {

    @Value("${jwt.secret}")
    String k;

    protected void doFilterInternal(
            HttpServletRequest r,
            HttpServletResponse p,
            FilterChain c)
            throws ServletException, IOException {

        String h = r.getHeader("Authorization");

        if (h != null && h.startsWith("Bearer ")) {
            try {
                Claims x = Jwts.parser()
                        .verifyWith(Keys.hmacShaKeyFor(
                                k.getBytes(StandardCharsets.UTF_8)))
                        .build()
                        .parseSignedClaims(h.substring(7))
                        .getPayload();

                SecurityContextHolder.getContext().setAuthentication(
                        new UsernamePasswordAuthenticationToken(
                                        String.valueOf(x.get("userId")),
                                null,
                                java.util.List.of(
                                        new SimpleGrantedAuthority(
                                                "ROLE_" +
                                                x.get("role", String.class)
                                        )
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

@Configuration
public class SecurityConfig {

    @Bean
    SecurityFilterChain c(HttpSecurity h, JwtFilter f) throws Exception {

        return h
                .csrf(x -> x.disable())
                .sessionManagement(x ->
                        x.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )
                .authorizeHttpRequests(x -> x
                        .requestMatchers(
                                "/swagger-ui.html",
                                "/swagger-ui/**",
                                "/v3/api-docs/**"
                        ).permitAll()
                        .requestMatchers(HttpMethod.GET, "/fines").hasRole("ADMIN")
                        .anyRequest().authenticated()
                )
                .addFilterBefore(
                        f,
                        UsernamePasswordAuthenticationFilter.class
                )
                .build();
    }
}