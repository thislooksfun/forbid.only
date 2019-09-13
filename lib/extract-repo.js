module.exports = repo => {
  const { name, full_name } = repo;
  const owner = full_name.slice(0, -name.length - 1);
  return { owner, repo: name };
};
