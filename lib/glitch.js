const crypto = require("crypto"); // pre-installed node package
const cmd = require("node-cmd");

module.exports = app => {
  const router = app.route("/glitch");

  // Update Glitch app from latest GitHub code
  router.post("/git", (req, res) => {
    // Check signature
    let hmac = crypto.createHmac("sha1", process.env.SECRET);
    let sig = "sha1=" + hmac.update(JSON.stringify(req.body)).digest("hex");
    if (sig != req.headers["x-hub-signature"]) {
      return res.sendStatus(401); // Not authorized
    }

    // Make sure event is "push"
    if (req.headers["x-github-event"] != "push") {
      return res.sendStatus(200); // Send back OK status
    }

    console.log("> [GIT] Updating from origin/master");

    // If event is "push"
    cmd.run("chmod 777 git.sh"); /* :/ Fix no perms after updating */
    cmd.get("./git.sh", (err, data) => {
      // Run our script
      if (data) console.log(data);
      if (err) console.log(err);
    });
    cmd.run("refresh"); // Refresh project

    console.log("> [GIT] Updated with origin/master");

    return res.sendStatus(200); // Send back OK status
  });
};
