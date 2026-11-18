package com.alisport.gym.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.alisport.gym.domain.AppUser;
import com.alisport.gym.domain.Role;

import java.util.Optional;

public interface AppUserRepository extends JpaRepository<AppUser, Long> {
    Optional<AppUser> findByUsernameIgnoreCase(String username);

    long countByRoleAndActiveTrue(Role role);
}
