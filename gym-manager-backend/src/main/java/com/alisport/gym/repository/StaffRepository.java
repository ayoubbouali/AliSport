package com.alisport.gym.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.alisport.gym.domain.Staff;

public interface StaffRepository extends JpaRepository<Staff, Long> {
    boolean existsByFunctionId(Long functionId);
}
