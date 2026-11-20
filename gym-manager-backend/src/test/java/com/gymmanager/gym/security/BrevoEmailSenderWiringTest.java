package com.gymmanager.gym.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

import static org.assertj.core.api.Assertions.assertThat;

/** Property wiring of the Spring-built sender; nothing is sent. */
class BrevoEmailSenderWiringTest {
    private final ApplicationContextRunner runner = new ApplicationContextRunner().withBean(BrevoEmailSender.class);

    @Test
    @DisplayName("Spring injecte app.mail.brevo.api-key et app.mail.from : configuré")
    void configuredFromProperties() {
        runner.withPropertyValues("app.mail.brevo.api-key=xkeysib-test", "app.mail.from=no-reply@gym.test")
                .run(ctx -> assertThat(ctx.getBean(BrevoEmailSender.class).isConfigured()).isTrue());
    }

    @Test
    @DisplayName("Clé vide : non configuré")
    void blankKey() {
        runner.withPropertyValues("app.mail.brevo.api-key=", "app.mail.from=no-reply@gym.test")
                .run(ctx -> assertThat(ctx.getBean(BrevoEmailSender.class).isConfigured()).isFalse());
    }
}
