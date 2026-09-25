# Test results reporting

## Local use

Run the reporter from the repository's application directory (`frontend/` or `server/`):

```bash
npm run test:report
```

The command runs every configured suite, saves complete test-runner output, and prints only totals and actionable failures. It exits with code `0` only when every suite passes. Test failures, suite-load errors, runner crashes, and malformed runner output return a non-zero exit code.

Run one configured suite by its exact name:

```bash
npm run test:report -- --suite "Unit tests"
npm run test:report -- --suite "Server tests"
```

Use `--verbose` when the captured log tail is useful during local debugging:

```bash
npm run test:report -- --verbose
```

The generated `.test-report/` directory contains:

- `report.html`: readable, failure-first report;
- `summary.md`: compact GitHub job summary;
- `result.json`: normalized machine-readable result;
- `email.eml`: MIME message used by CI only when tests fail;
- `suites/<suite>/raw.log`: complete stdout and stderr;
- `suites/<suite>/runner-results.json`: native framework JSON.

The directory is ignored by Git. Running the reporter safely replaces the previous generated report.

## GitHub Actions email setup

Create these Actions secrets without committing their values:

```text
TEST_REPORT_SMTP_USER=<the Gmail address already used by the Server>
TEST_REPORT_SMTP_APP_PASSWORD=<the same Gmail app password used by the Server>
```

Either add both as repository secrets in each Avihu repository, or create organization secrets restricted to exactly the Admin, Client, and Server repositories.

The workflow:

1. runs the reporter while allowing the reporting steps to continue;
2. always adds `summary.md` to the job summary;
3. always uploads `.test-report/` as an artifact;
4. sends `email.eml` through Gmail SMTPS only when the test step fails and both secrets exist;
5. records missing credentials or delivery failure in the job summary;
6. restores the failed job status after reporting.

Successful runs never invoke SMTP. Local runs only generate files and never send email. Pull requests from forks normally have no secrets, so they skip email but still upload the report and fail correctly.

## Controlled CI verification

After configuring the secrets, use a temporary failing-test commit to confirm exactly one email arrives at `michaelgani815@gmail.com`, the counts and GitHub run link are correct, the artifact downloads, and the workflow remains failed. Follow with a normal commit that removes the intentional failure and confirm the successful run sends no email. Do not rewrite history or leave the intentional failure in the branch.

