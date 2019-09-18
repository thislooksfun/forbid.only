const initRepos = require("./lib/init-repos");
const processPR = require("./lib/process-pr");
const glitch = require("./lib/glitch");

module.exports = robot => {
  // Register glitch events
  glitch(robot);

  // Keep a handy log of all events
  robot.on("*", c => c.log(`Got event of type ${c.name}`));

  // Installed on a new account
  robot.on("installation.created", async context => {
    await initRepos(context, context.payload.repositories);
  });
  // New repos were added to existing install
  robot.on("installation_repositories.added", async context => {
    await initRepos(context, context.payload.repositories_added);
  });

  robot.on(
    [
      // New PR
      "pull_request.opened",
      // PR was closed then re-opened (rationale: thislooksfun/forbid.only#5)
      "pull_request.reopened",
      // New code in existing PR
      "pull_request.synchronize",
    ],
    async context => {
      await processPR(context, context.payload.pull_request);
    }
  );
};
