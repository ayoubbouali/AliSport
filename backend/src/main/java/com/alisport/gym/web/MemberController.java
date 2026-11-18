package com.alisport.gym.web;

import com.alisport.gym.common.ApiException;
import com.alisport.gym.common.FileStorage;
import com.alisport.gym.service.ClubState;
import com.alisport.gym.service.ClubStateService;
import com.alisport.gym.service.MemberService;
import com.alisport.gym.service.Views.ActivityView;
import com.alisport.gym.service.Views.MemberView;
import com.alisport.gym.web.dto.Requests.ActiveRequest;
import com.alisport.gym.web.dto.Requests.MemberPreviewRequest;
import com.alisport.gym.web.dto.Requests.MemberRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/members")
@RequiredArgsConstructor
public class MemberController {
    private final ClubStateService state;
    private final MemberService service;
    private final FileStorage files;

    @GetMapping
    public List<MemberView> list() {
        return state.load().members();
    }

    public record MemberCard(MemberView member, List<ActivityView> activities, String alertMessage, String whatsappLink,
                             List<com.alisport.gym.service.Views.SubscriptionView> subscriptions, java.time.LocalDate renewalStart) {
    }

    /** Member card by code (e.g. A003): direct access by URL. */
    @GetMapping("/by-code/{code}")
    public MemberCard byCode(@PathVariable String code) {
        ClubState st = state.load();
        MemberView m = st.members().stream().filter(x -> x.code().equalsIgnoreCase(code)).findFirst()
                .orElseThrow(() -> ApiException.notFound("Aucun adhérent avec le code " + code + "."));
        var alert = ClubStateService.alertFor(m, st.cfg());
        boolean showWhatsapp = m.situation() == com.alisport.gym.rules.Rules.Situation.EXPIRED
                || m.situation() == com.alisport.gym.rules.Rules.Situation.SOON;
        var periods = st.subscriptions().stream().filter(s -> s.memberId().equals(m.id()))
                .sorted((a, b) -> b.startDate().compareTo(a.startDate())).toList();
        return new MemberCard(m, st.activities().stream().filter(a -> m.activityIds().contains(a.id())).toList(),
                showWhatsapp ? alert.message() : null, showWhatsapp ? alert.link() : null,
                periods, com.alisport.gym.rules.Rules.renewalStart(m.endDate(), st.today()));
    }

    @PostMapping("/preview")
    public MemberService.Preview preview(@RequestBody MemberPreviewRequest r) {
        return service.preview(r);
    }

    @PostMapping
    public MemberView create(@RequestBody MemberRequest r, java.security.Principal user) {
        Long id = service.save(null, r, user.getName()).getId();
        return state.load().member(id).orElseThrow();
    }

    @PutMapping("/{id}")
    public MemberView update(@PathVariable Long id, @RequestBody MemberRequest r, java.security.Principal user) {
        service.save(id, r, user.getName());
        return state.load().member(id).orElseThrow();
    }

    @PatchMapping("/{id}/active")
    public ResponseEntity<Void> active(@PathVariable Long id, @RequestBody ActiveRequest r) {
        service.setActive(id, Boolean.TRUE.equals(r.active()));
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/photo")
    public ResponseEntity<Resource> photo(@PathVariable Long id) {
        String name = service.photoName(id);
        return files.find(name)
                .<ResponseEntity<Resource>>map(p -> ResponseEntity.ok().contentType(FileStorage.mediaType(name))
                        .cacheControl(CacheControl.noCache().cachePrivate()).body(new FileSystemResource(p)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/photo")
    public MemberView uploadPhoto(@PathVariable Long id, @RequestParam("file") MultipartFile file) {
        service.setPhoto(id, file);
        return state.load().member(id).orElseThrow();
    }

    @DeleteMapping("/{id}/photo")
    public ResponseEntity<Void> deletePhoto(@PathVariable Long id) {
        service.deletePhoto(id);
        return ResponseEntity.noContent().build();
    }
}
