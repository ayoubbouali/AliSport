package com.alisport.gym.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.alisport.gym.domain.StaffFunction;

public interface StaffFunctionRepository extends JpaRepository<StaffFunction, Long> {
}
