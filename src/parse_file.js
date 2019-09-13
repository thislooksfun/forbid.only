const removeBlockComments = f => f.replace(/\/\*(?:.|\n)*?\*\//g, "");

const removeLineComments = f => f.replace(/\/\/.*/g, "");

module.exports = (robot, file) => {
  file = removeBlockComments(file);
  file = removeLineComments(file);

  return file;
};
