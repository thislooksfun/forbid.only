const path = require("path");
const extractRepo = require("./extract-repo");

// Get all parsers
const parsers = {};
require("fs")
  .readdirSync(path.join(__dirname, "parsers"))
  .forEach(function(file) {
    const { name } = path.parse(file);
    parsers[`.${name}`] = require("./parsers/" + file);
  });

// Parse a given file
module.exports = async (context, pull_request, { filename, status }) => {
  // If the file was deleted, don't try to parse it.
  if (status == "removed") {
    return { skipReason: "file was deleted" };
  }

  const repo = extractRepo(pull_request.base.repo);
  const { sha: ref } = pull_request.head;

  context.log.debug(`Parsing file ${filename}`);

  const { ext } = path.parse(filename);
  const parser = parsers[ext];

  if (parser == null) {
    const msg = `No parser for file type ${ext}`;
    context.log.warn(msg);
    return { skipReason: msg };
  }

  context.log.debug(`Fetching file ${filename} @ ${ref}`);

  const { data: raw } = await context.github.repos.getContents({
    ...repo,
    path: filename,
    ref,
    headers: { accept: "application/vnd.github.v3.raw" },
  });

  context.log.debug(`Applying parser ${ext} to ${filename}`);
  const errors = parser(raw).map(e => ({ ...e, path: filename }));
  return { errors };
};
