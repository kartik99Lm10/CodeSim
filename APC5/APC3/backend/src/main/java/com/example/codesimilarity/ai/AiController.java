package com.example.codesimilarity.ai;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

record SolveRequest(String problem) {}

@RestController
@RequestMapping("/api/ai")
public class AiController {
    private final AiService aiService;

    public AiController(AiService aiService) {
        this.aiService = aiService;
    }

    @PostMapping("/solve")
    public ResponseEntity<?> solve(@RequestBody SolveRequest req) {
        String code = aiService.getJavaSolution(req.problem());
        return ResponseEntity.ok(java.util.Map.of("code", code));
    }
}
