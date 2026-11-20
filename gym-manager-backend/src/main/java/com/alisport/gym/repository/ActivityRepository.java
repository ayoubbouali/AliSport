package com.alisport.gym.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.alisport.gym.domain.Activity;

public interface ActivityRepository extends JpaRepository<Activity, Long> {
    boolean existsByManagerId(Long staffId);
}
