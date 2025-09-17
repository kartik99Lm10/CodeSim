package com.example.codesimilarity.similarity;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api")
public class SimilarityController {
    private final SimilarityService similarityService;

    public SimilarityController(SimilarityService similarityService) {
        this.similarityService = similarityService;
    }

    @PostMapping(value = "/check-similarity", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> checkSimilarity(@RequestBody CompareRequest request) {
        SimilarityService.Result result = similarityService.compare(request.getCodeA(), request.getCodeB());
        return ResponseEntity.ok(result);
    }

    @PostMapping(value = "/check-similarity/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> checkSimilarityUpload(@RequestPart("fileA") MultipartFile fileA,
                                                   @RequestPart("fileB") MultipartFile fileB) throws IOException {
        String a = new String(fileA.getBytes(), StandardCharsets.UTF_8);
        String b = new String(fileB.getBytes(), StandardCharsets.UTF_8);
        SimilarityService.Result result = similarityService.compare(a, b);
        return ResponseEntity.ok(result);
    }

    public static class CompareRequest {
        private String codeA;
        private String codeB;
        public String getCodeA() { return codeA; }
        public void setCodeA(String codeA) { this.codeA = codeA; }
        public String getCodeB() { return codeB; }
        public void setCodeB(String codeB) { this.codeB = codeB; }
    }
}


