package com.bibliotech.auth.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.bibliotech.auth.dto.AuthRequests.ChangePassword;
import com.bibliotech.auth.dto.AuthRequests.UpdateProfile;
import com.bibliotech.auth.dto.AuthRequests.UserSummary;
import com.bibliotech.auth.entity.Role;
import com.bibliotech.auth.entity.User;
import com.bibliotech.auth.repository.UserRepository;
import com.bibliotech.auth.security.JwtService;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

class AuthServiceTest {
	private final UserRepository repository = mock(UserRepository.class);
	private final PasswordEncoder encoder = mock(PasswordEncoder.class);
	private final AuthService service = new AuthService(repository, encoder, mock(JwtService.class));

	@Test
	void profileUpdatePreservesMemberIdAndRole() {
		User member = member();
		when(repository.existsByEmailAndIdNot("new@example.com", 42L)).thenReturn(false);
		when(repository.findById(42L)).thenReturn(Optional.of(member));
		when(repository.save(member)).thenReturn(member);

		UserSummary updated = service.updateProfile(42L, new UpdateProfile("Updated Member", "new@example.com"));

		assertEquals(42L, updated.id());
		assertEquals("ADMIN", updated.role());
		assertEquals("Updated Member", updated.name());
		assertEquals("new@example.com", updated.email());
		verify(repository).save(member);
	}

	@Test
	void passwordChangeStoresOnlyTheEncodedNewPassword() {
		User member = member();
		when(repository.findById(42L)).thenReturn(Optional.of(member));
		when(encoder.matches("current-secret", "existing-hash")).thenReturn(true);
		when(encoder.matches("new-secret-123", "existing-hash")).thenReturn(false);
		when(encoder.encode("new-secret-123")).thenReturn("new-encoded-hash");
		when(repository.save(member)).thenReturn(member);

		service.changePassword(42L, new ChangePassword("current-secret", "new-secret-123"));

		assertEquals("new-encoded-hash", member.getPassword());
		assertNotEquals("new-secret-123", member.getPassword());
		verify(repository).save(member);
	}

	@Test
	void passwordChangeRejectsIncorrectCurrentPasswordWithoutSaving() {
		User member = member();
		when(repository.findById(42L)).thenReturn(Optional.of(member));
		when(encoder.matches("incorrect", "existing-hash")).thenReturn(false);

		assertThrows(IllegalArgumentException.class,
				() -> service.changePassword(42L, new ChangePassword("incorrect", "new-secret-123")));

		assertEquals("existing-hash", member.getPassword());
		verifyNoInteractionsAfterFind();
	}

	@Test
	void passwordChangeRejectsNewPasswordsBelowMinimumLength() {
		assertThrows(IllegalArgumentException.class,
				() -> service.changePassword(42L, new ChangePassword("current-secret", "short")));
		verifyNoInteractions(repository);
	}

	private User member() {
		User member = new User();
		ReflectionTestUtils.setField(member, "id", 42L);
		member.setName("Original Member");
		member.setEmail("original@example.com");
		member.setPassword("existing-hash");
		member.setRole(Role.ADMIN);
		return member;
	}

	private void verifyNoInteractionsAfterFind() {
		verify(repository).findById(42L);
		org.mockito.Mockito.verifyNoMoreInteractions(repository);
	}
}
