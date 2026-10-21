package com.bibliotech.rental.dto;public class RentalRequests{public record Borrow(Long userId,Long bookId,Integer loanDays){} }
