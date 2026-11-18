package com.alisport.gym.web;

import com.alisport.gym.common.FileStorage;
import com.alisport.gym.domain.AppSetting;
import com.alisport.gym.repository.SettingRepository;
import com.alisport.gym.security.UserService;
import com.alisport.gym.security.UserService.UserView;
import com.alisport.gym.service.InsightService;
import com.alisport.gym.settings.SettingDef;
import com.alisport.gym.settings.SettingsCatalog;
import com.alisport.gym.settings.SettingsService;
import com.alisport.gym.common.CodeService;
import com.alisport.gym.web.dto.Requests.*;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Dashboard, alerts (all roles); statistics, settings and users (ADMIN, see SecurityConfig). */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AdminController {
    private final InsightService insights;
    private final SettingsService settings;
    private final SettingRepository settingRepo;
    private final CodeService codes;
    private final UserService users;
    private final FileStorage files;

    @GetMapping("/dashboard")
    public InsightService.Dashboard dashboard() {
        return insights.dashboard();
    }

    @GetMapping("/alerts")
    public InsightService.Alerts alerts() {
        return insights.alerts();
    }

    @GetMapping("/stats")
    public InsightService.Stats stats(@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return insights.stats(from, to);
    }

    // ---------------------------------------------------------------- settings

    public record SettingsPayload(Map<String, String> groups, List<SettingDef> definitions, Map<String, String> values,
                                  Map<String, String> nextCodes) {
    }

    @GetMapping("/settings")
    public SettingsPayload getSettings() {
        Map<String, String> next = new LinkedHashMap<>();
        SettingsCatalog.CODE_ENTITIES.forEach(e -> next.put(e, codes.peek(e)));
        return new SettingsPayload(SettingsCatalog.GROUPS, SettingsCatalog.ALL, settings.raw(), next);
    }

    @PutMapping("/settings")
    public SettingsPayload updateSettings(@RequestBody SettingsUpdateRequest r) {
        settings.update(r.values() == null ? Map.of() : r.values());
        return getSettings();
    }

    @PostMapping("/settings/reset/{group}")
    @Transactional
    public SettingsPayload resetSettings(@PathVariable String group) {
        settings.reset(group);
        if ("club".equals(group)) {
            settingRepo.findById(ClubController.LOGO_KEY).map(AppSetting::getValue).ifPresent(files::delete);
            settingRepo.deleteById(ClubController.LOGO_KEY);
        }
        return getSettings();
    }

    // ---------------------------------------------------------------- users

    @GetMapping("/users")
    public List<UserView> listUsers() {
        return users.list();
    }

    @PostMapping("/users")
    public UserView createUser(@RequestBody UserCreateRequest r) {
        return users.create(r);
    }

    @PutMapping("/users/{id}")
    public UserView updateUser(@PathVariable Long id, @RequestBody UserUpdateRequest r, Principal p) {
        return users.update(id, r, p.getName());
    }

    @PostMapping("/users/{id}/reset-password")
    public ResponseEntity<Void> resetPassword(@PathVariable Long id, @RequestBody ResetPasswordRequest r) {
        users.resetPassword(id, r.password());
        return ResponseEntity.noContent().build();
    }
}
