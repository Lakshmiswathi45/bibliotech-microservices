package com.bibliotech.fine.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.bibliotech.fine.entity.Fine;
import com.bibliotech.fine.repository.FineRepository;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

class FineControllerTest {
	private final FineRepository repository = mock(FineRepository.class);
	private final FineController controller = new FineController(repository);

	@Test
	void memberCanRetrieveTheirOwnFineRecords() {
		Authentication member = new UsernamePasswordAuthenticationToken(
				"42", null, List.of(new SimpleGrantedAuthority("ROLE_USER")));
		List<Fine> records = List.of(new Fine());
		when(repository.findByUserId(42L)).thenReturn(records);

		assertEquals(records, controller.byUser(42L, member));
		verify(repository).findByUserId(42L);
	}

	@Test
	void memberCannotRetrieveAnotherMembersFineRecords() {
		Authentication member = new UsernamePasswordAuthenticationToken(
				"42", null, List.of(new SimpleGrantedAuthority("ROLE_USER")));

		assertThrows(AccessDeniedException.class, () -> controller.byUser(99L, member));

		verifyNoInteractions(repository);
	}
}
