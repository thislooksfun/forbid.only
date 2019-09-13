// Checks API example
// See: https://developer.github.com/v3/checks/ to learn more

const add_check = require("./add_check");
const parse_js = require("./parsers/js");

const fs = require("fs");
const path = require("path");

// module.exports = app => {
//   app.on("pull_request.opened", async context => {
//     const filesChanged = await context.github.pullRequests.getFiles(
//       context.issue()
//     );
//     const results = filesChanged.data.filter(file =>
//       file.filename.includes(".md")
//     );
//     if (results && results.length > 0) {
//       // make URLs
//       let urls = "";
//       await results.forEach(async result => {
//         urls += `\n[View rendered ${result.filename}](${context.payload.pull_request.head.repo.html_url}/blob/${context.payload.pull_request.head.ref}/${result.filename})`;
//       });
//       await context.github.pullRequests.update(
//         context.issue({
//           body: `${context.payload.pull_request.body}\n\n-----${urls}`,
//         })
//       );
//     }
//   });
// };

/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Application} app
 */
module.exports = app => {
  app.on("*", log);
  // app.on(["pull_request"], check);

  function log(context) {
    console.dir(context);

    const annotations = parse_js(
      fs.readFileSync(
        // path.join(__dirname, "../../test/fixtures/invalid/describe.only.js")
        path.join(__dirname, "../test/fixtures/invalid/describe.only.js")
      )
    ).map(o => ({
      ...o,
      path: "test/fixtures/valid/skipped/describe.only.js",
      annotation_level: "failure",
      title: "forbid.only",
      message: "It looks like you forgot to remove a `.only` call!",
    }));

    console.log("annotations", annotations);
  }

  async function check(context) {
    const startTime = new Date();

    // Do stuff
    const {
      head_branch: headBranch,
      head_sha: headSha,
    } = context.payload.check_suite;

    return add_check({
      headBranch,
      headSha,
      startTime,
      status: "completed",
      conclusion: "success",
    });
  }

  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
};
