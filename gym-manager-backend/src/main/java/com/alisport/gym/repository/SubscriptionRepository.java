package com.alisport.gym.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.alisport.gym.domain.Subscription;

import java.util.List;

public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {
    List<Subscription> findByMemberIdOrderByStartDateAscIdAsc(Long memberId);

    boolean existsByPackId(Long packId);

    boolean existsByDiscountId(Long discountId);
}
