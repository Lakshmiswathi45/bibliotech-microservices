package com.bibliotech.rental.service;

import com.bibliotech.rental.dto.RentalRequests.Borrow;
import com.bibliotech.rental.entity.Rental;
import com.bibliotech.rental.entity.Status;
import com.bibliotech.rental.repository.RentalRepository;
import com.bibliotech.rental.security.InternalServiceTokenProvider;
import java.net.URI;
import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.cloud.client.ServiceInstance;
import org.springframework.cloud.client.loadbalancer.LoadBalancerClient;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

@Service
public class RentalService {
	private final RentalRepository repository;
	private final RestTemplate rest;
	private final RestTemplate directRest;
	private final HttpServletRequest request;
	private final InternalServiceTokenProvider serviceTokens;
	private final LoadBalancerClient loadBalancer;

	public RentalService(
			RentalRepository repository,
			RestTemplate rest,
			@Qualifier("directRestTemplate") RestTemplate directRest,
			HttpServletRequest request,
			InternalServiceTokenProvider serviceTokens,
			LoadBalancerClient loadBalancer) {
		this.repository = repository;
		this.rest = rest;
		this.directRest = directRest;
		this.request = request;
		this.serviceTokens = serviceTokens;
		this.loadBalancer = loadBalancer;
	}

	private HttpHeaders userHeaders() {
		HttpHeaders headers = new HttpHeaders();
		headers.set("Authorization", request.getHeader("Authorization"));
		return headers;
	}

	private void call(String url, HttpMethod method, Object body) {
		rest.exchange(url, method, new HttpEntity<>(body, userHeaders()), Object.class);
	}

	private void changeBookAvailability(Long bookId, int change) {
		ServiceInstance instance = loadBalancer.choose("BOOK-SERVICE");
		if (instance == null) {
			throw new IllegalStateException("No BOOK-SERVICE instance is available");
		}
		String serviceToken = serviceTokens.createBookServiceToken();
		HttpHeaders headers = new HttpHeaders();
		headers.setBearerAuth(serviceToken);
		URI destination = UriComponentsBuilder.fromUri(instance.getUri())
				.path("/books/{bookId}/availability")
				.queryParam("change", change)
				.buildAndExpand(bookId)
				.toUri();
		directRest.exchange(destination, HttpMethod.POST, new HttpEntity<>(null, headers), Object.class);
	}

	@Transactional
	public Rental borrow(Borrow borrow) {
		if (repository.existsByUserIdAndBookIdAndStatusIn(
				borrow.userId(), borrow.bookId(), List.of(Status.BORROWED, Status.OVERDUE))) {
			throw new IllegalStateException("User already has an active rental for this book");
		}

		changeBookAvailability(borrow.bookId(), -1);
		try {
		    Rental rental = new Rental();
		    rental.setUserId(borrow.userId());
		    rental.setBookId(borrow.bookId());
		    rental.setBorrowDate(LocalDate.now());
		    rental.setDueDate(LocalDate.now().plusDays(borrow.loanDays() == null ? 14 : borrow.loanDays()));
		    rental.setStatus(Status.BORROWED);
		    rental = repository.save(rental);
		    call("http://NOTIFICATION-SERVICE/notifications", HttpMethod.POST,
			    Map.of("userId", borrow.userId(), "rentalId", rental.getId(),
				    "message", "Book with ID " + borrow.bookId() + " borrowed.", "type", "BORROW"));
		    return rental;
		} catch (RuntimeException failure) {
		    compensateAvailability(borrow.bookId(), 1, failure);
		    throw failure;
		}
	}

	public Rental get(Long id) {
		return repository.findById(id).orElseThrow(() -> new NoSuchElementException("Rental not found"));
	}

	public List<Rental> all() {
		return repository.findAll();
	}

	public List<Rental> byUser(Long userId) {
		return repository.findByUserId(userId);
	}

	@Transactional
	public Map<String, Object> returnBook(Long id) {
		Rental rental = repository.findByIdForUpdate(id)
				.orElseThrow(() -> new NoSuchElementException("Rental not found"));
		if (rental.getStatus() == Status.RETURNED) {
			throw new IllegalStateException("Book was already returned");
		}
		rental.setReturnDate(LocalDate.now());
		rental.setStatus(Status.RETURNED);
		rental = repository.save(rental);
		Long bookId = rental.getBookId();
		try {
			changeBookAvailability(bookId, 1);
			    Object fine = rest.exchange(
					"http://FINE-SERVICE/fines/calculate",
					HttpMethod.POST,
					new HttpEntity<>(Map.of(
							"rentalId", rental.getId(),
							"userId", rental.getUserId(),
							"dueDate", rental.getDueDate().toString(),
							    "returnDate", rental.getReturnDate().toString()), userHeaders()),
						    Object.class).getBody();

			call("http://NOTIFICATION-SERVICE/notifications", HttpMethod.POST,
					Map.of("userId", rental.getUserId(), "rentalId", rental.getId(),
							"message", "Book with ID " + bookId + " returned.", "type", "RETURN"));
			return Map.of("rental", rental, "fine", fine == null ? Map.of() : fine);
		} catch (RuntimeException failure) {
			compensateAvailability(bookId, -1, failure);
			throw failure;
		}
	}

	private void compensateAvailability(Long bookId, int change, RuntimeException failure) {
		try {
			changeBookAvailability(bookId, change);
		} catch (RuntimeException compensationFailure) {
			failure.addSuppressed(compensationFailure);
		}
	}
}
