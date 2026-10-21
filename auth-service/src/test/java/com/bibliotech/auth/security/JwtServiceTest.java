package com.bibliotech.auth.security;

import static org.junit.jupiter.api.Assertions.assertEquals;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

class JwtServiceTest {
	private static final String SECRET = "test-secret-that-is-at-least-32-bytes-long";

	@Test
	void loginTokenCarriesMemberIdAndUnprefixedRoleClaim() {
		JwtService service = new JwtService();
		ReflectionTestUtils.setField(service, "secret", SECRET);
		ReflectionTestUtils.setField(service, "expiry", 60_000L);

		String token = service.create(6L, "member@example.com", "ADMIN");
		Claims claims = Jwts.parser()
				.verifyWith(Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8)))
				.build()
				.parseSignedClaims(token)
				.getPayload();

		assertEquals("member@example.com", claims.getSubject());
		assertEquals(6, ((Number) claims.get("userId")).intValue());
		assertEquals("ADMIN", claims.get("role", String.class));
	}
}
