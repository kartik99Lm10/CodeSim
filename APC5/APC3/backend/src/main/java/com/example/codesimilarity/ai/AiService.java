package com.example.codesimilarity.ai;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.Map;

@Service
public class AiService {
    private final WebClient webClient;
    private final String apiKey;

    public AiService(@Value("${gemini.apiKey:}") String apiKey) {
        this.apiKey = apiKey;
        this.webClient = WebClient.builder().baseUrl("https://generativelanguage.googleapis.com").build();
    }

    public String getJavaSolution(String problemStatement) {
        if (apiKey == null || apiKey.isBlank()) {
            return "// Gemini API key not configured. Please set gemini.apiKey in env or application.yml";
        }
        String systemPrompt = "You are an expert competitive programmer. Provide a concise, correct Java solution. Return ONLY Java code in one class named Solution with a main method or a method solve(). No explanation.";
        Map<String, Object> body = Map.of(
                "contents", new Object[]{ Map.of(
                        "parts", new Object[]{
                                Map.of("text", systemPrompt + "\nProblem:\n" + problemStatement)
                        }
                )}
        );
        try {
            Map<?, ?> resp = webClient.post()
                    .uri("/v1beta/models/gemini-1.5-flash:generateContent?key=" + apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .onErrorResume(err -> Mono.just(Map.of()))
                    .block();
            if (resp == null) return "// No response from Gemini";
            Object candidates = resp.get("candidates");
            if (!(candidates instanceof java.util.List<?> list) || list.isEmpty()) {
                return "// Gemini returned empty response";
            }
            Object first = list.get(0);
            if (!(first instanceof Map<?, ?> c)) return "// Unexpected response format";
            Object content = c.get("content");
            if (!(content instanceof Map<?, ?> contentMap)) return "// Unexpected response format";
            Object parts = contentMap.get("parts");
            if (!(parts instanceof java.util.List<?> partsList) || partsList.isEmpty()) return "// No parts";
            Object p0 = partsList.get(0);
            if (!(p0 instanceof Map<?, ?> p0m)) return "// Unexpected response format";
            Object text = p0m.get("text");
            if (text == null) return "// No text in response";
            String raw = String.valueOf(text);

            String cleaned = raw.replaceAll("(?s)```(?:java)?\\s*", "").replace("```", "").trim();
            return cleaned;
        } catch (Exception e) {
            return "// Error calling Gemini: " + e.getMessage();
        }
    }
}
