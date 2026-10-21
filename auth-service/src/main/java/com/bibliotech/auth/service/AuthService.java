package com.bibliotech.auth.service;

import com.bibliotech.auth.dto.AuthRequests.*;
import com.bibliotech.auth.entity.*;
import com.bibliotech.auth.repository.*;
import com.bibliotech.auth.security.*;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Locale;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
	private final UserRepository repo;
	private final PasswordEncoder encoder;
	private final JwtService jwt;

	public AuthService(UserRepository r, PasswordEncoder e, JwtService j) {
		repo = r;
		encoder = e;
		jwt = j;
	}

	public void register(Register request) {
		if (request.name() == null || request.name().isBlank()
				|| request.email() == null || request.email().isBlank()
				|| request.password() == null || request.password().isBlank()) {
			throw new IllegalArgumentException("Name, email, and password are required");
		}
		if (repo.existsByEmail(request.email())) {
			throw new IllegalArgumentException("Email already registered");
		}

		Role role;
		try {
			role = request.role() == null || request.role().isBlank()
					? Role.USER
					: Role.valueOf(request.role().trim().toUpperCase(Locale.ROOT));
		} catch (IllegalArgumentException exception) {
			throw new IllegalArgumentException("Role must be USER or ADMIN");
		}

		User user = new User();
		user.setName(request.name().trim());
		user.setEmail(request.email().trim());
		user.setPassword(encoder.encode(request.password()));
		user.setRole(role);
		repo.save(user);
	}

	public Token login(Login credentials) {
		User user = repo.findByEmail(credentials.email())
				.orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));
		if (!encoder.matches(credentials.password(), user.getPassword())) {
			throw new IllegalArgumentException("Invalid email or password");
		}
		return new Token(
				jwt.create(user.getId(), user.getEmail(), user.getRole().name()),
				user.getRole().name(),
				user.getId());
	}

	public List<UserSummary> listUsers() {
		return repo.findAll().stream()
				.map(this::toSummary)
				.toList();
	}

	public UserSummary getProfile(Long userId) {
		return toSummary(findUser(userId));
	}

	public UserSummary updateProfile(Long userId, UpdateProfile request) {
		if (request == null || request.name() == null || request.name().isBlank()
				|| request.email() == null || request.email().isBlank()) {
			throw new IllegalArgumentException("Name and email are required");
		}

		String name = request.name().trim();
		String email = request.email().trim();
		if (name.length() > 120) {
			throw new IllegalArgumentException("Name must be 120 characters or fewer");
		}
		if (email.length() > 254 || !email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
			throw new IllegalArgumentException("Enter a valid email address");
		}
		if (repo.existsByEmailAndIdNot(email, userId)) {
			throw new IllegalArgumentException("Email already registered");
		}

		User user = findUser(userId);
		user.setName(name);
		user.setEmail(email);
		return toSummary(repo.save(user));
	}

	public void changePassword(Long userId, ChangePassword request) {
		if (request == null || request.currentPassword() == null || request.currentPassword().isBlank()) {
			throw new IllegalArgumentException("Current password is required");
		}
		String newPassword = request.newPassword();
		if (newPassword == null || newPassword.length() < 8
				|| newPassword.getBytes(StandardCharsets.UTF_8).length > 72) {
			throw new IllegalArgumentException("New password must be at least 8 characters and no more than 72 UTF-8 bytes");
		}

		User user = findUser(userId);
		if (!encoder.matches(request.currentPassword(), user.getPassword())) {
			throw new IllegalArgumentException("Current password is incorrect");
		}
		if (encoder.matches(newPassword, user.getPassword())) {
			throw new IllegalArgumentException("New password must be different from the current password");
		}
		user.setPassword(encoder.encode(newPassword));
		repo.save(user);
	}

	private User findUser(Long userId) {
		return repo.findById(userId).orElseThrow(() -> new IllegalArgumentException("Account not found"));
	}

	private UserSummary toSummary(User user) {
		return new UserSummary(user.getId(), user.getName(), user.getEmail(), user.getRole().name());
	}
}
