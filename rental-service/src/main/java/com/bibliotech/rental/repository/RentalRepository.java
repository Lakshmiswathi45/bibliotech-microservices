package com.bibliotech.rental.repository;

import com.bibliotech.rental.entity.Rental;
import com.bibliotech.rental.entity.Status;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

public interface RentalRepository extends JpaRepository<Rental, Long> {
	boolean existsByUserIdAndBookIdAndStatusIn(Long userId, Long bookId, Collection<Status> statuses);
	List<Rental> findByUserId(Long userId);

	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@Query("select rental from Rental rental where rental.id = :id")
	Optional<Rental> findByIdForUpdate(@Param("id") Long id);
}
