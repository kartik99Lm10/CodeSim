package com.example.codesimilarity.compile;

import org.springframework.stereotype.Service;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Service
public class CompileService {
    public Result compileJava(String code, String className) {
        if (code == null || code.isBlank()) {
            return new Result(false, List.of("No code provided"));
        }
        if (className == null || className.isBlank()) {
            className = "Solution";
        }
        Path tempDir = null;
        try {
            tempDir = Files.createTempDirectory("compile-");
            Path source = tempDir.resolve(className + ".java");
            Files.writeString(source, code);

            List<String> cmd = new ArrayList<>();
            cmd.add("javac");
            cmd.add(source.toString());

            ProcessBuilder pb = new ProcessBuilder(cmd);
            pb.directory(tempDir.toFile());
            pb.redirectErrorStream(true);
            Process p = pb.start();
            String output = new String(p.getInputStream().readAllBytes());
            int exit = p.waitFor();
            boolean success = exit == 0;
            List<String> messages = new ArrayList<>();
            if (!output.isBlank()) messages.add(output);
            if (success) {
                messages.add("Compilation successful");
            }
            return new Result(success, messages);
            
        } catch (IOException | InterruptedException e) {
            return new Result(false, List.of("Error: " + e.getMessage()));
        } finally {
            if (tempDir != null) {
                try { Files.walk(tempDir).sorted((a,b) -> b.compareTo(a)).forEach(p -> { try { Files.deleteIfExists(p);} catch (IOException ignored) {} }); } catch (Exception ignored) {}
            }
        }
    }

    public Result runJava(String code, String className) {
        if (code == null || code.isBlank()) {
            return new Result(false, List.of("No code provided"));
        }
        if (className == null || className.isBlank()) {
            className = "Solution";
        }
        Path tempDir = null;
        try {
            tempDir = Files.createTempDirectory("run-");
            Path source = tempDir.resolve(className + ".java");
            Files.writeString(source, code);
            
            List<String> compileCmd = List.of("javac", source.toString());
            ProcessBuilder compilePb = new ProcessBuilder(compileCmd);
            compilePb.directory(tempDir.toFile());
            compilePb.redirectErrorStream(true);
            Process compileP = compilePb.start();
            String compileOutput = new String(compileP.getInputStream().readAllBytes());
            int compileExit = compileP.waitFor();
            
            if (compileExit != 0) {
                return new Result(false, List.of("Compilation failed:", compileOutput));
            }

            // Run the compiled code
            List<String> runCmd = List.of("java", className);
            ProcessBuilder runPb = new ProcessBuilder(runCmd);
            runPb.directory(tempDir.toFile());
            runPb.redirectErrorStream(true);
            Process runP = runPb.start();
            // Close stdin to signal EOF in case the program is reading input
            try { runP.getOutputStream().close(); } catch (IOException ignored) {}
            boolean finished = runP.waitFor(2000, TimeUnit.MILLISECONDS);
            String runOutput = "";
            int runExit = -1;
            if (finished) {
                runOutput = new String(runP.getInputStream().readAllBytes());
                runExit = runP.exitValue();
            }
            
            List<String> messages = new ArrayList<>();
            messages.add("Program output:");
            if (!runOutput.isBlank()) {
                messages.add(runOutput);
            } else {
                messages.add("(no output)");
            }
            if (!finished) {
                try { runP.destroyForcibly(); } catch (Exception ignored) {}
                messages.add("Timed out after 2000 ms");
            } else if (runExit != 0) {
                messages.add("Exit code: " + runExit);
            }
            
            return new Result(finished && runExit == 0, messages);
        } catch (IOException | InterruptedException e) {
            return new Result(false, List.of("Error: " + e.getMessage()));
        } finally {
            if (tempDir != null) {
                try { Files.walk(tempDir).sorted((a,b) -> b.compareTo(a)).forEach(p -> { try { Files.deleteIfExists(p);} catch (IOException ignored) {} }); } catch (Exception ignored) {}
            }
        }
    }

    public Result runJavaWithInput(String code, String className, String inputStdin) {
        if (code == null || code.isBlank()) {
            return new Result(false, List.of("No code provided"));
        }
        if (className == null || className.isBlank()) {
            className = "Solution";
        }
        Path tempDir = null;
        try {
            tempDir = Files.createTempDirectory("run-");
            Path source = tempDir.resolve(className + ".java");
            Files.writeString(source, code);

            // Compile first
            List<String> compileCmd = List.of("javac", source.toString());
            ProcessBuilder compilePb = new ProcessBuilder(compileCmd);
            compilePb.directory(tempDir.toFile());
            compilePb.redirectErrorStream(true);
            Process compileP = compilePb.start();
            String compileOutput = new String(compileP.getInputStream().readAllBytes());
            int compileExit = compileP.waitFor();

            if (compileExit != 0) {
                return new Result(false, List.of("Compilation failed:", compileOutput));
            }

            // Run the compiled code and pass stdin
            List<String> runCmd = List.of("java", className);
            ProcessBuilder runPb = new ProcessBuilder(runCmd);
            runPb.directory(tempDir.toFile());
            runPb.redirectErrorStream(true);
            Process runP = runPb.start();
            if (inputStdin != null && !inputStdin.isEmpty()) {
                try {
                    runP.getOutputStream().write(inputStdin.getBytes());
                    runP.getOutputStream().flush();
                } catch (IOException ignored) {}
            }
            // Always close stdin so programs don't block waiting for EOF
            try { runP.getOutputStream().close(); } catch (IOException ignored) {}
            boolean finished = runP.waitFor(2000, TimeUnit.MILLISECONDS);
            String runOutput = "";
            int runExit = -1;
            if (finished) {
                runOutput = new String(runP.getInputStream().readAllBytes());
                runExit = runP.exitValue();
            }

            List<String> messages = new ArrayList<>();
            messages.add("Program output:");
            if (!runOutput.isBlank()) {
                messages.add(runOutput);
            } else {
                messages.add("(no output)");
            }
            if (!finished) {
                try { runP.destroyForcibly(); } catch (Exception ignored) {}
                messages.add("Timed out after 2000 ms");
            } else if (runExit != 0) {
                messages.add("Exit code: " + runExit);
            }

            return new Result(finished && runExit == 0, messages);
        } catch (IOException | InterruptedException e) {
            return new Result(false, List.of("Error: " + e.getMessage()));
        } finally {
            if (tempDir != null) {
                try { Files.walk(tempDir).sorted((a,b) -> b.compareTo(a)).forEach(p -> { try { Files.deleteIfExists(p);} catch (IOException ignored) {} }); } catch (Exception ignored) {}
            }
        }
    }

    public record Result(boolean success, List<String> messages) {}

    public record TestCase(String input, String expected) {}
    public record TestResult(int index, boolean pass, String output, String expected, String error, int exitCode, long timeMs) {}
    public record TestSuiteResult(boolean success, List<TestResult> results, int passed, int total) {}

    public TestSuiteResult testJava(String code, String className, List<TestCase> tests, int timeoutMs) {
        if (code == null || code.isBlank()) {
            return new TestSuiteResult(false, List.of(new TestResult(0, false, "", "", "No code provided", -1, 0)), 0, tests == null ? 0 : tests.size());
        }
        if (className == null || className.isBlank()) {
            className = "Solution";
        }
        if (tests == null || tests.isEmpty()) {
            tests = List.of(
                    new TestCase("hello\n", "olleh"),
                    new TestCase("ab cd\n", "dc ba"),
                    new TestCase("A man, a plan, a canal: Panama\n", "amanaP :lanac a ,nalp a ,nam A"),
                    new TestCase("\n", ""),
                    new TestCase("a\n", "a"),
                    new TestCase("racecar\n", "racecar"),
                    new TestCase("  lead space\n", "ecaps dael  "),
                    new TestCase("trail space  \n", "  ecapS liart"),
                    new TestCase("12345\n", "54321"),
                    new TestCase("Hello, World!\n", "!dlroW ,olleH")
            );
        }
        if (timeoutMs <= 0) timeoutMs = 2000;

        Path tempDir = null;
        try {
            tempDir = Files.createTempDirectory("test-");
            Path source = tempDir.resolve(className + ".java");
            Files.writeString(source, code);

            // Compile once
            List<String> compileCmd = List.of("javac", source.toString());
            ProcessBuilder compilePb = new ProcessBuilder(compileCmd);
            compilePb.directory(tempDir.toFile());
            compilePb.redirectErrorStream(true);
            Process compileP = compilePb.start();
            String compileOutput = new String(compileP.getInputStream().readAllBytes());
            int compileExit = compileP.waitFor();
            if (compileExit != 0) {
                return new TestSuiteResult(false, List.of(new TestResult(0, false, compileOutput, "", "Compilation failed", compileExit, 0)), 0, tests.size());
            }

            List<TestResult> results = new ArrayList<>();
            int passed = 0;
            for (int i = 0; i < tests.size(); i++) {
                TestCase tc = tests.get(i);
                long start = System.currentTimeMillis();
                List<String> runCmd = List.of("java", className);
                ProcessBuilder runPb = new ProcessBuilder(runCmd);
                runPb.directory(tempDir.toFile());
                runPb.redirectErrorStream(true);
                Process runP = runPb.start();
                if (tc.input() != null && !tc.input().isEmpty()) {
                    try {
                        runP.getOutputStream().write(tc.input().getBytes());
                        runP.getOutputStream().flush();
                    } catch (IOException ignored) {}
                    try { runP.getOutputStream().close(); } catch (IOException ignored) {}
                }
                boolean finished = runP.waitFor(timeoutMs, TimeUnit.MILLISECONDS);
                long timeMs = System.currentTimeMillis() - start;
                if (!finished) {
                    try { runP.destroyForcibly(); } catch (Exception ignored) {}
                    results.add(new TestResult(i, false, "(timeout)", tc.expected(), "Timed out", -1, timeMs));
                    continue;
                }
                String runOutput = new String(runP.getInputStream().readAllBytes());
                int exit = runP.exitValue();
                String normalized = runOutput.replaceAll("\r\n", "\n");
                // Consider last non-empty line to be the actual answer (tolerate prompts/labels)
                String candidate = normalized.lines().filter(s -> !s.trim().isEmpty()).reduce((a,b) -> b).orElse("").trim();
                String expected = tc.expected() == null ? "" : tc.expected().replaceAll("\r\n", "\n").trim();
                boolean pass = exit == 0 && (candidate.equals(expected) || candidate.endsWith(expected));
                if (pass) passed++;
                results.add(new TestResult(i, pass, candidate.isEmpty() ? normalized.trim() : candidate, expected, exit == 0 ? "" : "Exit code: " + exit, exit, timeMs));
            }
            boolean allPass = passed == tests.size();
            return new TestSuiteResult(allPass, results, passed, tests.size());
        } catch (IOException | InterruptedException e) {
            return new TestSuiteResult(false, List.of(new TestResult(0, false, "", "", "Error: " + e.getMessage(), -1, 0)), 0, tests == null ? 0 : tests.size());
        } finally {
            if (tempDir != null) {
                try { Files.walk(tempDir).sorted((a,b) -> b.compareTo(a)).forEach(p -> { try { Files.deleteIfExists(p);} catch (IOException ignored) {} }); } catch (Exception ignored) {}
            }
        }
    }
}
