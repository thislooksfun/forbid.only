const parse = require("./lib/parse");

const annotationMessage =
  "You appear to have left a test marked with `.only`. This will prevent other tests from running, and will affect the accuracy of test runs.\n\nIf you really want to include this line you can put `// forbid.only::skip-next-line` on the previous line.";

module.exports = robot => {
  robot.on(
    ["pull_request.opened", "pull_request.synchronize"],
    async context => {
      const started_at = new Date();
      // Extract necessary info
      const pull = context.issue();
      const { sha: head_sha } = context.payload.pull_request.head;
      const repo = context.repo();

      // GH API
      const { paginate, issues, checks, pullRequests } = context.github;

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

      // Parse each file
      for (const file of files) {
        const { filename } = file;
        const { scanned, errors } = await parse(context, file);

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
      const buildDetails = (name, files) => {
        const summary = `<summary>${name} ${files.length} ${pluralize(
          "file",
          files.length
        )}</summary>`;
        const listItems = files.map(f => `<li><pre>${f}</pre></li>`);
        const list = `<ul>${listItems.join("")}</ul>`;
        return `<details>${summary}${list}</details>`;
      };

      // Build <detail> blocks
      const scannedFilesDetails = buildDetails("Scanned", report.files.scanned);
      const skippedFilesDetails = buildDetails("Skipped", report.files.skipped);

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
    }
  );
};
