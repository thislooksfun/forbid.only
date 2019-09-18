const parse = require("./parse");
const extractRepo = require("./extract-repo");
const newGithubIssueUrl = require("new-github-issue-url");

const annotationMessage =
  "You appear to have left a test marked with `.only`. This will prevent other tests from running, and will affect the accuracy of test runs.\n\nIf you really want to include this line you can put `// forbid.only::skip-next-line` on the previous line.";

// NOTE: Can't use context.payload.pull_request because the context might not
// *be* a PR. i.e. when iterating through pre-existing PRs on install, the
// context is the installation event, not the PR itself
module.exports = async (context, pull_request) => {
  // Log start time
  const started_at = new Date();

  // Extract number and sha
  const {
    number,
    head: { sha: head_sha },
  } = pull_request;

  // Construct a pull object
  // NOTE: Can't use context.repo() or context.issue() because the context might
  // not *be* an issue or repo. i.e. when iterating through pre-existing PRs on
  // install, the context is the installation event, not the repo or PR itself
  const repo = extractRepo(pull_request.base.repo);
  const pull = { ...repo, number };

  // GH API
  const { paginate, checks, pullRequests } = context.github;

  // Hold this PR info
  const checkInfo = { ...repo, head_sha, name: "forbid.only", started_at };

  // Set check status to in_progress
  const {
    data: { id: check_run_id },
  } = await checks.create({
    ...checkInfo,
    name: "forbid.only",
    status: "in_progress",
  });

  // Extract config
  // TODO: Implement config options?
  // const {
  //   commentLimit,
  //   commentMessage,
  //   skipBranchMatching,
  // } = await context.config("forbid.only.yml", {
  //   commentLimit: 10,
  //   commentMessage: "Please remember to remove your `.only` calls!",
  //   skipBranchMatching: null,
  // });

  // Construct a report
  const report = { files: { scanned: [], skipped: [] }, errors: [] };

  // Paginate all PR files
  const files = await paginate(pullRequests.listFiles(pull), p => p.data);

  try {
    // Parse each file
    for (const file of files) {
      const { filename } = file;
      const { scanned, errors } = await parse(context, pull_request, file);

      if (scanned) {
        // Track how many files were scanned
        report.files.scanned.push(filename);
        // Keep track of all errors
        report.errors = report.errors.concat(errors);
      } else {
        // Track how many files were skipped
        report.files.skipped.push(filename);
      }
    }

    // Build annotations
    const annotations = report.errors.map(e => ({
      ...e,
      annotation_level: "failure",
      title: "Found `.only`",
      message: annotationMessage,
      // raw_details: "Here are some raw juicy details",
    }));

    // Basic pluralization (just appends 's')
    const pluralize = (txt, num) => (num == 1 ? txt : `${txt}s`);

    // Helper to build <detail> blocks
    const buildDetails = (summary, details) =>
      `<details><summary>${summary}</summary>${details}</details>`;

    const fileDetails = (name, files) => {
      const pFile = pluralize("file", files.length);
      const summary = `${name} ${files.length} ${pFile}`;
      const listItems = files.map(f => `<li><pre>${f}</pre></li>`);
      const list = `<ul>${listItems.join("")}</ul>`;
      return buildDetails(summary, list);
    };

    // Build <detail> blocks
    const scannedFilesDetails = fileDetails("Scanned", report.files.scanned);
    const skippedFilesDetails = fileDetails("Skipped", report.files.skipped);

    // Set final check status
    await checks.update({
      ...checkInfo,
      check_run_id,
      conclusion: report.errors.length == 0 ? "success" : "failure",
      completed_at: new Date(),
      output: {
        title: `Found ${report.errors.length} ${pluralize(
          "problem",
          report.errors.length
        )}`,
        summary: `Scanned ${report.files.scanned.length} files and found ${report.errors.length} instances of \`.only\` calls.`,
        text: scannedFilesDetails + skippedFilesDetails,
        annotations,
      },
    });
  } catch (e) {
    const formattedStackTrace = "```\n" + e.stack + "\n```";
    // const testRun
    // TODO: Make this an autofill link (autofill title w/ message, body w/ stacktrace and link to test run)

    const prURL = pull_request.html_url;
    const checkRunURL = prURL + `/checks?check_run_id=${check_run_id}`;
    const prLink = `[Pull Request](${prURL})`;
    const checkRunLink = `[Check Run](${checkRunURL})`;
    const infoSection = `## Info\n\n- ${prLink}\n- ${checkRunLink}`;
    const stacktraceSection = `## Stacktrace\n\n${formattedStackTrace}`;
    const body = `${infoSection}\n\n${stacktraceSection}`;
    const newIssueLink = newGithubIssueUrl({
      user: "thislooksfun",
      repo: "forbid.only",
      title: "" + e,
      body,
    });

    // Set final check status
    await checks.update({
      ...checkInfo,
      check_run_id,
      conclusion: "failure",
      completed_at: new Date(),
      output: {
        title: "Something went wrong",
        summary: `\`${e}\`\n\nIf you see this, please [open an issue](${newIssueLink}).`,
        text: formattedStackTrace,
      },
    });
  }
};
