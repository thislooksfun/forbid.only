// opts: { headBranch, headSha, startTime, status, conclusion }
module.exports = opts => {
  // Probot API note: context.repo() => {username: 'hiimbex', repo: 'testing-things'}
  return context.github.checks.create(
    context.repo({
      ...opts,
      name: "forbid.only",
      completed_at: new Date(),
      output: {
        title: "Probot check!",
        summary: "The check has passed!",
      },
    })
  );
};
