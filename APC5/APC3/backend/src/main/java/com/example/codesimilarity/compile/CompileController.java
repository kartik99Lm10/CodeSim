package com.example.codesimilarity.compile;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

record CompileRequest(String code, String className) {}
record RunWithInputRequest(String code, String className, String input) {}
record TestCaseDto(String input, String expected) {}
record TestRequest(String code, String className, List<TestCaseDto> tests, Integer timeoutMs) {}

@RestController
@RequestMapping("/api/compile")
public class CompileController {
    private final CompileService compileService;

    public CompileController(CompileService compileService) {
        this.compileService = compileService;
    }

    @PostMapping("/java")
    public ResponseEntity<?> compileJava(@RequestBody CompileRequest req) {
        CompileService.Result res = compileService.compileJava(req.code(), req.className());
        return ResponseEntity.ok(Map.of(
                "success", res.success(),
                "messages", res.messages()
        ));
    }

    @PostMapping("/java/run")
    public ResponseEntity<?> runJava(@RequestBody CompileRequest req) {
        CompileService.Result res = compileService.runJava(req.code(), req.className());
        return ResponseEntity.ok(Map.of(
                "success", res.success(),
                "messages", res.messages()
        ));
    }

    @PostMapping("/java/runWithInput")
    public ResponseEntity<?> runJavaWithInput(@RequestBody RunWithInputRequest req) {
        CompileService.Result res = compileService.runJavaWithInput(req.code(), req.className(), req.input());
        return ResponseEntity.ok(Map.of(
                "success", res.success(),
                "messages", res.messages()
        ));
    }

    @PostMapping("/java/test")
    public ResponseEntity<?> testJava(@RequestBody TestRequest req) {
        List<CompileService.TestCase> testCases = req.tests() == null ? List.of() :
                req.tests().stream().map(t -> new CompileService.TestCase(t.input(), t.expected())).toList();
        CompileService.TestSuiteResult result = compileService.testJava(req.code(), req.className(), testCases, req.timeoutMs() == null ? 2000 : req.timeoutMs());
        return ResponseEntity.ok(Map.of(
                "success", result.success(),
                "results", result.results(),
                "passed", result.passed(),
                "total", result.total()
        ));
    }
}
