const acorn = require("acorn");
const walk = require("acorn-walk");

module.exports = function search(file) {
  const comments = [];
  const parsed = acorn.parse(file, { locations: true, onComment: comments });

  const commentsOnLine = line =>
    comments.filter(c => c.loc.start.line === line);
  const isSkipComment = c => c.value.trim() == "forbid.only::skip-next-line";

  const ignored = loc => {
    const cmntsOnPrevLine = commentsOnLine(loc.start.line - 1);
    const skipComments = cmntsOnPrevLine.filter(isSkipComment);
    return skipComments.length > 0;
  };

  const onlys = [];
  walk.simple(parsed, {
    MemberExpression(node) {
      // Make sure the object being accessed is one of `describe`, `it`, or `test`
      if (!["describe", "it", "test"].includes(node.object.name)) return;
      // Make sure the property being accessed is `only`
      if (node.property.name !== "only") return;

      // Grab a reference to the lication
      const loc = node.property.loc;

      // Make sure the statement isn't ignored
      if (ignored(loc)) return;

      // It's a match! Store it.
      const annotationPosition = {
        start_line: loc.start.line,
        end_line: loc.end.line,
      };
      // GitHub only cares about the column if the start and end lines match
      if (loc.start.line == loc.end.line) {
        annotationPosition.start_column = loc.start.column;
        annotationPosition.end_column = loc.end.column;
      }
      onlys.push(annotationPosition);
    },
  });

  return onlys;
};
