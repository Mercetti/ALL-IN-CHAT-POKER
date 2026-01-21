/**
 * Acey Overlay Testing Prompts
 * Prompts that Acey can use to help with Playwright testing
 */

const ACEY_TESTING_PROMPTS = {
  // Test generation prompt
  GENERATE_TESTS: `
As Acey, I can help generate comprehensive Playwright tests for the overlay system.

**Current Task**: Generate overlay tests based on HTML analysis

**Steps**:
1. Analyze the overlay HTML structure
2. Identify key elements that need testing
3. Generate appropriate test cases
4. Create assertions for expected behavior
5. Add interaction tests for dynamic elements

**Elements to Focus On**:
- Core overlay container (.overlay-container)
- Interactive elements (buttons, settings)
- Dynamic content (chat, animations)
- Visual elements (branding, statistics)
- Responsive behavior

**Test Patterns to Use**:
- Visibility checks for static elements
- Interaction tests for buttons/controls
- Content validation for dynamic elements
- State changes for user interactions

**Output Format**:
Provide complete, runnable Playwright test code with proper assertions.
`,

  // Test maintenance prompt
  MAINTAIN_TESTS: `
As Acey, I can help maintain and fix existing Playwright tests.

**Current Task**: Fix failing overlay tests

**Analysis Steps**:
1. Review the failing test error message
2. Identify the root cause (selector, timing, visibility)
3. Check current HTML structure for changes
4. Propose specific fixes for each issue
5. Update test code with corrections

**Common Issues to Fix**:
- Missing elements (update selectors)
- Timing issues (add waits)
- Visibility problems (remove hidden classes)
- Selector changes (update CSS selectors)

**Fix Strategy**:
- Be specific about exact changes needed
- Provide code snippets for fixes
- Explain why the fix will work
- Suggest preventive measures for future

**Output Format**:
Provide clear, actionable fixes with code examples.
`,

  // Test optimization prompt
  OPTIMIZE_TESTS: `
As Acey, I can help optimize Playwright test performance and reliability.

**Current Task**: Optimize overlay test suite

**Optimization Areas**:
1. **Performance**: Reduce test execution time
2. **Reliability**: Minimize flaky tests
3. **Coverage**: Ensure comprehensive testing
4. **Maintainability**: Clean, readable test code

**Specific Optimizations**:
- Add proper waits (waitForLoadState)
- Remove redundant checks
- Combine related tests
- Improve selector efficiency
- Add better error handling

**Best Practices to Apply**:
- Use data-testid for stable selectors
- Implement proper page load waiting
- Add descriptive test names
- Include helpful comments
- Group related tests logically

**Output Format**:
Provide optimized test code with performance improvements.
`,

  // Test coverage analysis prompt
  ANALYZE_COVERAGE: `
As Acey, I can analyze test coverage and identify gaps.

**Current Task**: Analyze overlay test coverage

**Coverage Analysis**:
1. **Element Coverage**: Which overlay elements are tested?
2. **Interaction Coverage**: Which user interactions are tested?
3. **State Coverage**: Which UI states are tested?
4. **Edge Cases**: What scenarios are missing?

**Coverage Categories**:
- ✅ Core functionality (basic overlay display)
- ✅ Interactive elements (buttons, settings)
- ✅ Dynamic content (chat, animations)
- ⚠️ Error states (connection failures)
- ⚠️ Responsive behavior (different screen sizes)
- ❌ Performance under load
- ❌ Accessibility features

**Recommendations**:
- Add missing test categories
- Improve existing test coverage
- Add edge case testing
- Include performance testing

**Output Format**:
Provide comprehensive coverage report with actionable recommendations.
`
};

// Export for use in Acey's system
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ACEY_TESTING_PROMPTS;
} else if (typeof window !== 'undefined') {
  window.ACEY_TESTING_PROMPTS = ACEY_TESTING_PROMPTS;
}
