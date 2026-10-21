package com.bibliotech.fine.repository;

import com.bibliotech.fine.entity.Fine;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FineRepository extends JpaRepository<Fine, Long> {
	Optional<Fine> findByRentalId(Long id);
	List<Fine> findByUserId(Long userId);
}
