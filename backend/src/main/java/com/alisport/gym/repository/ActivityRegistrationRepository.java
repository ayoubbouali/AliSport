package com.alisport.gym.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.alisport.gym.domain.ActivityRegistration;

public interface ActivityRegistrationRepository extends JpaRepository<ActivityRegistration, Long> {
    boolean existsByMemberIdAndActivityId(Long memberId, Long activityId);

    boolean existsByActivityId(Long activityId);

    long countByActivityId(Long activityId);

    void deleteByMemberId(Long memberId);
}
