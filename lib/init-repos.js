const processPR = require("./process-pr");
const extractRepo = require("./extract-repo");

// Repos is of the form
// [{
//   "id": 186853007,
//   "node_id": "MDEwOlJlcG9zaXRvcnkxODY4NTMwMDc=",
//   "name": "Space",
//   "full_name": "Codertocat/Space",
//   "private": false
// }]
module.exports = async (context, repos) => {
  // Installing on repos:
  console.log(repos);
  console.log(context.payload);

  const { paginate, pulls } = context.github;

  for (const repo of repos) {
    const prs = await paginate(
      pulls.list.endpoint.merge({ ...extractRepo(repo), state: "open" }),
      p => p.data
    );

    for (const pr of prs) {
      await processPR(context, pr);
    }
  }
};
