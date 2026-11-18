package com.alisport.gym.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.alisport.gym.domain.Duration;

public interface DurationRepository extends JpaRepository<Duration, Long> {
}
