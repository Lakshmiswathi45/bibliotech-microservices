package com.bibliotech.notification.controller;

import com.bibliotech.notification.entity.Notification;
import com.bibliotech.notification.repository.NotificationRepository;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import java.time.LocalDateTime;
import java.util.List;
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
@RequestMapping("/notifications")
@SecurityRequirement(name = "bearerAuth")
public class NotificationController {
	private final NotificationRepository repository;

	public NotificationController(NotificationRepository repository) {
		this.repository = repository;
	}

	@PostMapping
	public Notification add(@RequestBody Notification notification, Authentication authentication) {
		requireOwnerOrAdmin(authentication, notification.getUserId());
		notification.setCreatedAt(LocalDateTime.now());
		return repository.save(notification);
	}

	@GetMapping("/user/{id}")
	public List<Notification> byUser(@PathVariable Long id, Authentication authentication) {
		requireOwnerOrAdmin(authentication, id);
		return repository.findByUserId(id);
	}

	private void requireOwnerOrAdmin(Authentication authentication, Long userId) {
		boolean admin = authentication.getAuthorities().stream()
				.anyMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority()));
		if (!admin && !Objects.equals(Long.valueOf(authentication.getName()), userId)) {
			throw new AccessDeniedException("You can only access your own notifications");
		}
	}
}
