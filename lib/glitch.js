const crypto = require("crypto"); // pre-installed node package
const cmd = require("node-cmd");
const bodyParser = require("body-parser");

module.exports = app => {
  const router = app.route("/glitch");

  router.use(bodyParser.json());

  // Update Glitch app from latest GitHub code
  router.post("/git", (req, res) => {
    // Handle "ping" event
    if (req.headers["x-github-event"] == "ping") {
      app.log("Got GitHub webhook ping event");
      return res.sendStatus(200); // Send back OK status
    }

    console.log("rk", Object.keys(req));

    const { body } = req;

    console.log("Body:");
    console.dir(body);
    console.log("Stringified body:");
    console.dir(JSON.stringify(body));

    if (body == null) {
      return res.sendStatus(400); // Invalid
    }

    // Check signature
    const hmac = crypto.createHmac("sha1", process.env.SECRET);
    const sig = "sha1=" + hmac.update(JSON.stringify(body)).digest("hex");
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
