package com.example.codesimilarity.similarity;

import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Pattern;

@Service
public class SimilarityService {
    private static final Pattern NON_WORD = Pattern.compile("[^a-zA-Z0-9_]+");

    public Result compare(String a, String b) {
        if (a == null) a = "";
        if (b == null) b = "";
        List<String> tokensA = tokenize(a);
        List<String> tokensB = tokenize(b);

        double jaccard = jaccardSimilarity(tokensA, tokensB);
        double cosine = cosineSimilarity(tokensA, tokensB);

        double score = (jaccard * 0.5 + cosine * 0.5) * 100.0;
        String verdict = verdictFor(score);
        return new Result(round(score), verdict, jaccard, cosine);
    }

    private List<String> tokenize(String s) {
        String normalized = NON_WORD.matcher(s.toLowerCase()).replaceAll(" ").trim();
        if (normalized.isEmpty()) return List.of();
        return Arrays.stream(normalized.split("\\s+")).filter(tok -> tok.length() > 0).toList();
    }

    private double jaccardSimilarity(List<String> a, List<String> b) {
        Set<String> sa = new HashSet<>(a);
        Set<String> sb = new HashSet<>(b);
        if (sa.isEmpty() && sb.isEmpty()) return 1.0;
        Set<String> inter = new HashSet<>(sa);
        inter.retainAll(sb);
        Set<String> union = new HashSet<>(sa);
        union.addAll(sb);
        return (double) inter.size() / (double) union.size();
    }

    private double cosineSimilarity(List<String> a, List<String> b) {
        Map<String, Integer> freqA = frequency(a);
        Map<String, Integer> freqB = frequency(b);
        if (freqA.isEmpty() && freqB.isEmpty()) return 1.0;
        Set<String> keys = new HashSet<>();
        keys.addAll(freqA.keySet());
        keys.addAll(freqB.keySet());
        double dot = 0.0, normA = 0.0, normB = 0.0;
        for (String k : keys) {
            int fa = freqA.getOrDefault(k, 0);
            int fb = freqB.getOrDefault(k, 0);
            dot += fa * fb;
        }
        for (int v : freqA.values()) normA += v * v;
        for (int v : freqB.values()) normB += v * v;
        if (normA == 0 || normB == 0) return 0.0;
        return dot / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    private Map<String, Integer> frequency(List<String> tokens) {
        Map<String, Integer> map = new HashMap<>();
        for (String t : tokens) map.put(t, map.getOrDefault(t, 0) + 1);
        return map;
    }

    private String verdictFor(double score) {
        if (score >= 85) return "Highly Similar";
        if (score >= 60) return "Moderately Similar";
        return "Different";
    }

    private double round(double v) {
        return Math.round(v * 100.0) / 100.0;
    }

    public record Result(double score, String verdict, double jaccard, double cosine) {}
}


