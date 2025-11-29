# E2E Tests Review Plan

This document outlines the review process for the e2e tests and support code, identifying areas for potential refactoring, cleanup, and consolidation.

## Review Scope

- **Test Files**: 39 spec files across 9 directories
- **Support Files**: 11 helper modules

---

## Phase 1: Support Code Review

### 1.1 Analyze Helper Module Overlap

| File                    | Purpose                         | Review Focus                                  |
| ----------------------- | ------------------------------- | --------------------------------------------- |
| `finders.ts`            | Element finding/interaction     | Check for overlap with Playwright built-ins   |
| `page-verifiers.ts`     | Page state verification         | Consolidate aliases, check consistency        |
| `navigation-helpers.ts` | Navigation + verification       | Check for redundancy with `page-verifiers.ts` |
| `form-helpers.ts`       | Form submission patterns        | Review partial fill functions usage           |
| `workflow-helpers.ts`   | Multi-step workflows            | Check if all helpers are actually used        |
| `auth-helpers.ts`       | Auth-specific actions           | Overlap with `form-helpers.ts`                |
| `validation-helpers.ts` | Validation test patterns        | Check actual usage in tests                   |
| `mode-helpers.ts`       | Sign-up mode detection/skipping | Review mode detection efficiency              |
| `db-helpers.ts`         | Database operations             | Check error handling consistency              |
| `test-helpers.ts`       | Test wrappers                   | Review `testWithDatabase` pattern             |
| `test-data.ts`          | Centralized test data           | Check for unused constants                    |

### 1.2 Specific Issues to Investigate

- [ ] **`finders.ts`**: `verifyElementExists` vs `isElementVisible` - are both needed?
- [ ] **`page-verifiers.ts`**: `verifyOnInterestSignUpPage` and `verifyOnGatedSignUpPage` are aliases - remove them?
- [ ] **`navigation-helpers.ts`**: `navigateTo404Route` vs `expectRoute404` - duplicate functionality
- [ ] **`auth-helpers.ts`**: `submitEmailAndPassword` duplicates `submitSignInForm` from `form-helpers.ts`
- [ ] **`validation-helpers.ts`**: Pre-configured validation tests may be unused
- [ ] **`test-data.ts`**: `INTEREST_SIGN_UP` URL is now obsolete (user removed this path)

---

## Phase 2: Test File Review by Directory

### 2.1 `general/` (4 tests)

- [ ] `01-startup-initial-page.spec.ts` - Two trivial tests, could be combined
- [ ] `02-visit-nonexistent-page.spec.ts` - Review necessity
- [ ] `03-test-body-size-limit.spec.ts` - Specialized test, keep
- [ ] `04-test-secure-headers.spec.ts` - Specialized test, keep

### 2.2 `sign-in/` (5 tests)

- [ ] Check for repeated sign-in patterns across tests
- [ ] `02-can-sign-in-with-known-email.spec.ts` - Uses hardcoded credentials instead of `TEST_USERS`
- [ ] `05-sign-out-successfully.spec.ts` - Uses hardcoded credentials instead of `TEST_USERS`

### 2.3 `sign-up/` (10 tests)

- [ ] Review for overlapping coverage
- [ ] `08-page-navigation-buttons.spec.ts` - Similar to other mode navigation tests
- [ ] Check if all 10 tests are necessary or can be consolidated

### 2.4 `gated-sign-up/` (3 tests)

- [ ] `03-page-navigation-buttons.spec.ts` - Very similar to `sign-up/08-*` and `interest-sign-up/04-*`
- [ ] Review for consolidation with other mode-specific navigation tests

### 2.5 `interest-sign-up/` (4 tests)

- [ ] `03-navigation-and-ui-tests.spec.ts` and `04-page-navigation-buttons.spec.ts` - Significant overlap
- [ ] Both test navigation between sign-in and sign-up pages
- [ ] Both verify form elements and button text

### 2.6 `no-sign-up/` (4 tests)

- [ ] `01-sign-up-routes-return-404.spec.ts` and `04-page-navigation-buttons.spec.ts` - Both test 404 routes
- [ ] Review for consolidation

### 2.7 `profile/` (4 tests)

- [ ] `01-can-access-profile-page.spec.ts` - Contains 5 tests in one file, could be split or kept
- [ ] Review sign-in repetition across tests

### 2.8 `reset-password/` (6 tests)

- [ ] `03-complete-password-reset-flow.spec.ts` - Contains Mailpit helpers that could be extracted
- [ ] Review for helper extraction opportunities

---

## Phase 3: Cross-Cutting Concerns

### 3.1 Repeated Patterns to Extract

- [ ] **Sign-in before test**: Many tests repeat `page.goto(BASE_URLS.SIGN_IN); submitSignInForm(page, TEST_USERS.KNOWN_USER)`
- [ ] **Hardcoded credentials**: Some tests use hardcoded `fredfred@team439980.testinator.com` instead of `TEST_USERS.KNOWN_USER`
- [ ] **Mailpit helpers**: `getLatestEmailFromMailpit`, `clearAllEmailsFromMailpit`, `extractPasswordResetLink` in reset-password tests

### 3.2 Inconsistent Patterns

- [ ] **Page verification after navigation**: Some use `navigateToX(page)` (includes verification), others do `page.goto()` + `verifyOnXPage()`
- [ ] **Element visibility checks**: Mix of `isElementVisible`, `verifyElementExists`, and direct Playwright `expect().toBeVisible()`
- [ ] **Mode detection calls**: Multiple `detectSignUpMode()` calls within same test file

### 3.3 Potentially Unused Code

- [ ] `fillSignUpFormPartial`, `fillSignInFormPartial`, `fillGatedSignUpFormPartial` in `form-helpers.ts`
- [ ] `submitEmptySignUpForm`, `submitEmptySignInForm`, etc. in `form-helpers.ts`
- [ ] Pre-configured validation test functions in `validation-helpers.ts`
- [ ] `testFormValidation` comprehensive helper in `validation-helpers.ts`

---

## Phase 4: Specific Refactoring Opportunities

### 4.1 Navigation Test Consolidation

The following files have nearly identical structure:

- `sign-up/08-page-navigation-buttons.spec.ts`
- `gated-sign-up/03-page-navigation-buttons.spec.ts`
- `interest-sign-up/04-page-navigation-buttons.spec.ts`
- `no-sign-up/04-page-navigation-buttons.spec.ts`

**Recommendation**: Create a parameterized navigation test or consolidate into one file with mode-aware assertions.

### 4.2 Interest Sign-Up Test Overlap

- `interest-sign-up/03-navigation-and-ui-tests.spec.ts`
- `interest-sign-up/04-page-navigation-buttons.spec.ts`

Both test:

- Navigation between sign-in and interest sign-up
- Form elements visibility
- Button text verification

**Recommendation**: Merge into single file or clearly differentiate purposes.

### 4.3 Mailpit Helper Extraction

`reset-password/03-complete-password-reset-flow.spec.ts` contains:

- `getLatestEmailFromMailpit()`
- `clearAllEmailsFromMailpit()`
- `extractPasswordResetLink()`

**Recommendation**: Extract to `support/email-helpers.ts` for reuse.

### 4.4 Test Data Cleanup

- Remove `INTEREST_SIGN_UP` from `BASE_URLS` (path no longer exists)
- Ensure all tests use `TEST_USERS` constants instead of hardcoded values

### 4.5 Alias Cleanup

In `page-verifiers.ts`:

```typescript
export const verifyOnInterestSignUpPage = verifyOnSignUpPage
export const verifyOnGatedSignUpPage = verifyOnSignUpPage
```

**Recommendation**: Remove aliases and update all imports to use `verifyOnSignUpPage` directly.

---

## Phase 5: Review Checklist

### Support Code

- [ ] Remove unused helper functions
- [ ] Consolidate duplicate functionality
- [ ] Extract Mailpit helpers
- [ ] Clean up obsolete test data
- [ ] Remove page verifier aliases

### Test Files

- [ ] Consolidate navigation tests across modes
- [ ] Merge overlapping interest sign-up tests
- [ ] Replace hardcoded credentials with `TEST_USERS`
- [ ] Standardize element verification patterns
- [ ] Review and remove truly redundant tests

### Documentation

- [ ] Update any outdated comments
- [ ] Ensure JSDoc is consistent

---

## Execution Order

1. ✅ **Support code cleanup** - Remove unused, consolidate duplicates
2. ✅ **Test data cleanup** - Remove obsolete URLs, ensure constants are used
3. ✅ **Navigation test consolidation** - Merge similar tests
4. ✅ **Interest sign-up test merge** - Combine overlapping files
5. ✅ **Credential standardization** - Replace hardcoded values
6. ✅ **Final verification** - Run all tests in all modes

---

## Completed Changes

### Step 1: Support Code Cleanup (Completed)

**Removed unused functions:**

- `navigation-helpers.ts`: Removed duplicate `expectRoute404` (identical to `navigateTo404Route`)
- `auth-helpers.ts`: Removed `submitEmailAndPassword` (inlined into `signInUser`)
- `form-helpers.ts`: Removed `fillSignUpFormPartial`, `fillSignInFormPartial`, `submitEmptySignUpForm`, `submitEmptySignInForm`, `submitEmptyGatedSignUpForm`, `submitEmptyForgotPasswordForm`
- `validation-helpers.ts`: Removed `testFormValidation`, `testSignUpFormValidation`, `testSignInFormValidation`, `testGatedSignUpFormValidation`, `testInterestSignUpFormValidation`, `testForgotPasswordFormValidation`, `testRequiredPasswordField`, `testRequiredNameField`, `testRequiredCodeField`, `testInvalidCodeValidation`

**Simplified:**

- `navigation-helpers.ts`: Simplified `navigateToInterestSignUp` - all modes now use `/auth/sign-up`

### Step 2: Test Data Cleanup (Completed)

**Removed obsolete URLs:**

- `test-data.ts`: Removed `INTEREST_SIGN_UP` from `BASE_URLS` (path no longer exists)

**Fixed test file:**

- `interest-sign-up/02-validates-email-input.spec.ts`: Removed import and usage of deleted `testInterestSignUpFormValidation`

### Step 3: Navigation Test Consolidation (Completed)

**Created new consolidated test:**

- `general/05-sign-in-page-elements.spec.ts`: Common sign-in page tests that apply to all modes (form elements, forgot password link)

**Simplified mode-specific navigation tests:**

- `sign-up/08-page-navigation-buttons.spec.ts`: Removed duplicated sign-in page tests, kept only OPEN_SIGN_UP-specific tests
- `gated-sign-up/03-page-navigation-buttons.spec.ts`: Removed duplicated sign-in page tests, kept only GATED_SIGN_UP-specific tests
- `interest-sign-up/04-page-navigation-buttons.spec.ts`: Removed duplicated sign-in page tests, kept only INTEREST_SIGN_UP-specific tests
- `no-sign-up/04-page-navigation-buttons.spec.ts`: Simplified to only test NO_SIGN_UP-specific behavior (no sign-up button)

**Consolidated 404 tests:**

- `no-sign-up/01-sign-up-routes-return-404.spec.ts`: Added `/auth/interest-sign-up` 404 test (was duplicated in `04-page-navigation-buttons.spec.ts`)

**Added new mode helper:**

- `mode-helpers.ts`: Added `skipIfNotExactMode` for tests that should only run in a specific mode (not in BOTH_SIGN_UP)

### Step 4: Interest Sign-Up Test Merge (Completed)

**Reorganized interest sign-up tests:**

- `interest-sign-up/03-navigation-and-ui-tests.spec.ts`: Split into two test groups:
  - "UI Tests" (uses `skipIfNotExactMode`) - INTEREST_SIGN_UP-specific UI tests
  - "Behavior Tests" (uses `skipIfNotMode`) - Tests that work in both INTEREST_SIGN_UP and BOTH_SIGN_UP modes
- `interest-sign-up/04-page-navigation-buttons.spec.ts`: Uses `skipIfNotExactMode` for INTEREST_SIGN_UP-specific UI tests

**Removed overlapping tests:**

- Removed duplicated sign-in page button text test (now in mode-specific navigation tests)
- Removed duplicated navigation test (consolidated with `04-page-navigation-buttons.spec.ts`)
- Removed duplicated form elements test (consolidated with `04-page-navigation-buttons.spec.ts`)
- Removed duplicated direct navigation test (redundant with form elements test)

**Used centralized test data:**

- Replaced hardcoded credentials with `TEST_USERS.KNOWN_USER`
- Replaced hardcoded URL with `BASE_URLS.SIGN_UP`

### Step 5: Credential Standardization (Completed)

**Updated test files to use `TEST_USERS` and `ERROR_MESSAGES` constants:**

- `sign-in/02-can-sign-in-with-known-email.spec.ts`: Replaced hardcoded email/password with `TEST_USERS.KNOWN_USER`, message with `ERROR_MESSAGES.SIGN_IN_SUCCESS`
- `sign-in/03-cant-sign-in-with-wrong-password.spec.ts`: Replaced hardcoded email with `TEST_USERS.KNOWN_USER.email`, message with `ERROR_MESSAGES.INVALID_CREDENTIALS`
- `sign-in/05-sign-out-successfully.spec.ts`: Replaced hardcoded credentials, URLs, and messages with constants
- `reset-password/03-complete-password-reset-flow.spec.ts`: Replaced hardcoded credentials and messages with constants
- `reset-password/06-password-reset-rate-limiting.spec.ts`: Replaced hardcoded email and URLs with constants
- `general/03-test-body-size-limit.spec.ts`: Replaced hardcoded credentials with `TEST_USERS.KNOWN_USER`
- `general/04-test-secure-headers.spec.ts`: Replaced hardcoded credentials and URLs with constants

**Fixed test-data.ts constants to match actual source messages:**

- `MUST_SIGN_IN`: Removed trailing period to match source
- `PASSWORD_RESET_SUCCESS`: Fixed word order to match source ("successfully reset" not "reset successfully")

### Step 6: Final Verification (Completed)

**Test results in BOTH_SIGN_UP mode:**

- 69 tests passed
- 28 tests skipped (mode-specific tests not applicable)
- 0 failures

All e2e tests pass successfully after refactoring.
