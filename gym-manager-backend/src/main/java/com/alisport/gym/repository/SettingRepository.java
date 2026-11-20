package com.alisport.gym.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.alisport.gym.domain.AppSetting;

public interface SettingRepository extends JpaRepository<AppSetting, String> {
}
