package com.bibliotech.rental.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.bibliotech.rental.dto.RentalRequests.Borrow;
import com.bibliotech.rental.entity.Rental;
import com.bibliotech.rental.service.RentalService;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

class RentalControllerTest {
	private final RentalService service = mock(RentalService.class);
	private final RentalController controller = new RentalController(service);

	@Test
	void memberCanBorrowForTheirAuthenticatedAccount() {
		Authentication member = authentication("6", "ROLE_USER");
		Borrow request = new Borrow(6L, 10L, 14);
		Rental rental = new Rental();
		when(service.borrow(request)).thenReturn(rental);

		assertEquals(rental, controller.borrow(request, member));
		verify(service).borrow(request);
	}

	@Test
	void memberCannotBorrowOnBehalfOfAnotherAccount() {
		Authentication member = authentication("6", "ROLE_USER");
		Borrow request = new Borrow(7L, 10L, 14);

		assertThrows(AccessDeniedException.class, () -> controller.borrow(request, member));

		verifyNoInteractions(service);
	}

	@Test
	void adminAuthorityUsesSpringRolePrefixAndCanBorrowForAnotherAccount() {
		Authentication admin = authentication("6", "ROLE_ADMIN");
		Borrow request = new Borrow(7L, 10L, 14);
		Rental rental = new Rental();
		when(service.borrow(request)).thenReturn(rental);

		assertEquals(rental, controller.borrow(request, admin));
		verify(service).borrow(request);
	}

	private Authentication authentication(String userId, String authority) {
		return new UsernamePasswordAuthenticationToken(
				userId, null, List.of(new SimpleGrantedAuthority(authority)));
	}
}
