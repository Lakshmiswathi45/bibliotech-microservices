package com.bibliotech.rental.controller;

import com.bibliotech.rental.dto.RentalRequests.Borrow;
import com.bibliotech.rental.entity.Rental;
import com.bibliotech.rental.service.RentalService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/rentals")
@SecurityRequirement(name = "bearerAuth")
public class RentalController {
	private final RentalService service;

	public RentalController(RentalService service) {
		this.service = service;
	}

	@Operation(summary = "Borrow a book")
	@PostMapping("/borrow")
	public Rental borrow(@RequestBody Borrow request, Authentication authentication) {
		requireOwnerOrAdmin(authentication, request.userId());
		return service.borrow(request);
	}

	@PostMapping("/return/{id}")
	public Map<String, Object> returnBook(@PathVariable Long id, Authentication authentication) {
		requireOwnerOrAdmin(authentication, service.get(id).getUserId());
		return service.returnBook(id);
	}

	@GetMapping
	public List<Rental> all(Authentication authentication) {
		requireAdmin(authentication);
		return service.all();
	}

	@GetMapping("/{id}")
	public Rental get(@PathVariable Long id, Authentication authentication) {
		Rental rental = service.get(id);
		requireOwnerOrAdmin(authentication, rental.getUserId());
		return rental;
	}

	@GetMapping("/user/{id}")
	public List<Rental> byUser(@PathVariable Long id, Authentication authentication) {
		requireOwnerOrAdmin(authentication, id);
		return service.byUser(id);
	}

	private void requireOwnerOrAdmin(Authentication authentication, Long userId) {
		if (!isAdmin(authentication) && !Objects.equals(Long.valueOf(authentication.getName()), userId)) {
			throw new AccessDeniedException("You can only access your own rental records");
		}
	}

	private void requireAdmin(Authentication authentication) {
		if (!isAdmin(authentication)) {
			throw new AccessDeniedException("Administrator access is required");
		}
	}

	private boolean isAdmin(Authentication authentication) {
		return authentication.getAuthorities().stream()
				.anyMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority()));
	}
}
