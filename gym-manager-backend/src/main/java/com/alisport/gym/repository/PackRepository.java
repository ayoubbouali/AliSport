package com.alisport.gym.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.alisport.gym.domain.Pack;

public interface PackRepository extends JpaRepository<Pack, Long> {
    boolean existsBySportId(Long sportId);

    boolean existsByDurationId(Long durationId);

    boolean existsByDiscountId(Long discountId);
}
