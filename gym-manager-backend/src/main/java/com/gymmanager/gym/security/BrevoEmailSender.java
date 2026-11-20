package com.gymmanager.gym.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.StreamUtils;
import org.springframework.web.client.RestClient;

import java.net.ProxySelector;
import java.net.http.HttpClient;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;

/**
 * Sends through Brevo's transactional HTTP API rather than SMTP, whose ports are blocked on some
 * networks and hosts; only HTTPS (possibly through a proxy) is needed.
 */
@Component
public class BrevoEmailSender implements EmailSender {
    static final Duration TIMEOUT = Duration.ofSeconds(10);
    private static final int MAX_ERROR_BODY = 300;

    private final RestClient rest;
    private final String url;
    private final String apiKey;
    private final String from;

    @Autowired
    public BrevoEmailSender(@Value("${app.mail.brevo.url:https://api.brevo.com/v3/smtp/email}") String url,
                            @Value("${app.mail.brevo.api-key:}") String apiKey,
                            @Value("${app.mail.from:}") String from) {
        this(url, apiKey, from, new EnvProxySelector(System.getenv()));
    }

    BrevoEmailSender(String url, String apiKey, String from, ProxySelector proxySelector) {
        this.url = url;
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.from = from == null ? "" : from.trim();
        HttpClient httpClient = HttpClient.newBuilder()
                .connectTimeout(TIMEOUT)
                .proxy(proxySelector)
                .build();
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(httpClient);
        factory.setReadTimeout(TIMEOUT);
        this.rest = RestClient.builder().requestFactory(factory).build();
    }

    @Override
    public boolean isConfigured() {
        return !apiKey.isEmpty() && !from.isEmpty();
    }

    @Override
    public void send(String to, String subject, String text) {
        rest.post()
                .uri(url)
                .header("api-key", apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
                .body(new BrevoEmail(new Address(from), List.of(new Address(to)), subject, text))
                .retrieve()
                .onStatus(status -> !status.is2xxSuccessful(), (request, response) -> {
                    String body = StreamUtils.copyToString(response.getBody(), StandardCharsets.UTF_8);
                    if (body.length() > MAX_ERROR_BODY) body = body.substring(0, MAX_ERROR_BODY) + "…";
                    throw new BrevoException(response.getStatusCode().value(), body);
                })
                .toBodilessEntity();
    }

    record Address(String email) {
    }

    record BrevoEmail(Address sender, List<Address> to, String subject, String textContent) {
    }

    static class BrevoException extends RuntimeException {
        final int status;

        BrevoException(int status, String body) {
            super("Brevo API returned HTTP " + status + ": " + body);
            this.status = status;
        }
    }
}
