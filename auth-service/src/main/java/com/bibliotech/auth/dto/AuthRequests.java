package com.bibliotech.auth.dto;

public class AuthRequests {
	public record Register(String name, String email, String password, String role) {}
	public record Login(String email, String password) {}
	public record Token(String token, String role, Long userId) {}
	public record UserSummary(Long id, String name, String email, String role) {}
	public record UpdateProfile(String name, String email) {}
	public record ChangePassword(String currentPassword, String newPassword) {}
}
