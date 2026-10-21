package com.bibliotech.fine.controller;

import com.bibliotech.fine.entity.Fine;
import com.bibliotech.fine.repository.FineRepository;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Objects;
import java.util.List;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/fines")
@SecurityRequirement(name = "bearerAuth")
public class FineController {
	private final FineRepository repository;

	public FineController(FineRepository repository) {
		this.repository = repository;
	}

	@GetMapping("/{id}")
	public Fine get(@PathVariable Long id, Authentication authentication) {
		Fine fine = repository.findByRentalId(id)
				.orElseThrow(() -> new NoSuchElementException("Fine not found"));
		requireOwnerOrAdmin(authentication, fine.getUserId());
		return fine;
	}

	@GetMapping
	public List<Fine> all() {
		return repository.findAll();
	}

	@GetMapping("/user/{id}")
	public List<Fine> byUser(@PathVariable Long id, Authentication authentication) {
		requireOwnerOrAdmin(authentication, id);
		return repository.findByUserId(id);
	}

	@PostMapping("/{id}/demo-payment")
	@Transactional
	public Fine markDemoPaymentPaid(@PathVariable Long id, Authentication authentication) {
		Fine fine = repository.findByRentalId(id)
				.orElseThrow(() -> new NoSuchElementException("Fine not found"));
		requireOwnerOrAdmin(authentication, fine.getUserId());
		if (!"PAID".equals(fine.getStatus())) {
			fine.setStatus("PAID");
			return repository.save(fine);
		}
		return fine;
	}

	@PostMapping("/calculate")
	public Fine calculate(@RequestBody Map<String, String> request, Authentication authentication) {
		Long userId = Long.valueOf(request.get("userId"));
		requireOwnerOrAdmin(authentication, userId);
		Long rentalId = Long.valueOf(request.get("rentalId"));
		Fine existing = repository.findByRentalId(rentalId).orElse(null);
		if (existing != null) {
		    requireOwnerOrAdmin(authentication, existing.getUserId());
		    return existing;
		}
		long daysOverdue = Math.max(0, ChronoUnit.DAYS.between(
			LocalDate.parse(request.get("dueDate")),
			LocalDate.parse(request.get("returnDate"))));
		Fine fine = new Fine();
		fine.setRentalId(rentalId);
		fine.setUserId(userId);
		fine.setDaysOverdue((int) daysOverdue);
		fine.setFineAmount(BigDecimal.valueOf(Math.max(0, daysOverdue - 7) * 10));
		return repository.save(fine);
	}

	private void requireOwnerOrAdmin(Authentication authentication, Long userId) {
		boolean admin = authentication.getAuthorities().stream()
				.anyMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority()));
		if (!admin && !Objects.equals(Long.valueOf(authentication.getName()), userId)) {
			throw new AccessDeniedException("You can only access your own fine records");
		}
	}
}
