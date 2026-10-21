package com.bibliotech.auth.controller;

import com.bibliotech.auth.dto.AuthRequests.Login;
import com.bibliotech.auth.dto.AuthRequests.Register;
import com.bibliotech.auth.dto.AuthRequests.Token;
import com.bibliotech.auth.dto.AuthRequests.ChangePassword;
import com.bibliotech.auth.dto.AuthRequests.UpdateProfile;
import com.bibliotech.auth.dto.AuthRequests.UserSummary;
import com.bibliotech.auth.service.AuthService;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
public class AuthController {
	private final AuthService service;

	public AuthController(AuthService service) {
		this.service = service;
	}

	@PostMapping("/register")
	public ResponseEntity<Void> register(@RequestBody Register request) {
		service.register(request);
		return ResponseEntity.status(HttpStatus.CREATED).build();
	}

	@PostMapping("/login")
	public Token login(@RequestBody Login request) {
		return service.login(request);
	}

	@GetMapping("/me")
	public UserSummary profile(Authentication authentication) {
		return service.getProfile(userId(authentication));
	}

	@PutMapping("/me")
	public UserSummary updateProfile(@RequestBody UpdateProfile request, Authentication authentication) {
		return service.updateProfile(userId(authentication), request);
	}

	@PostMapping("/change-password")
	public ResponseEntity<Void> changePassword(
			@RequestBody ChangePassword request,
			Authentication authentication) {
		service.changePassword(userId(authentication), request);
		return ResponseEntity.noContent().build();
	}

	@GetMapping("/users")
	public List<UserSummary> users() {
		return service.listUsers();
	}

	private Long userId(Authentication authentication) {
		return Long.valueOf(authentication.getName());
	}
}
