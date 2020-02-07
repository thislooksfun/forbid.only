const fs = require("fs");
const path = require("path");
const nock = require("nock");
// Requiring our app implementation
const myProbotApp = require("../..");
const { Probot, createProbot } = require("probot");
// Requiring our common fixtures
const checkStatusStarted = require("../fixtures/check_status.started");

nock.disableNetConnect();

const repo = "/repos/thislooksfun/f.o.testing";

describe.each(["opened", "reopened", "synchronize"])(
  "pull_request.%s",
  action => {
    const payload = require(`../fixtures/pull_request.${action}`);

    let probot;

    beforeEach(() => {
      probot = createProbot({ id: 1, cert: "test", githubToken: "test" });
      probot.load(myProbotApp);
    });

    // Split common check run pattern into helper function
    const checkRun = async (checkStatusCompleted, changedFiles, rawFile) => {
      const n = nock("https://api.github.com");

      // Authorize
      n.post("/app/installations/2/access_tokens")
        .optionally()
        .reply(200, {
          token: "test",
        });

      // Create check run
      n.post(repo + "/check-runs", body => {
        expect(body).to.include.keys(["started_at"]);
        body.started_at = "2018-10-05T17:35:21.594Z";
        expect(body).to.eql(checkStatusStarted, "creating check run");
        return true;
      }).reply(200, { id: 1234 });

      // Get file list
      n.get(repo + "/pulls/13/files").reply(200, changedFiles);

      if (rawFile != null) {
        // Get raw file
        n.get(
          repo +
            "/contents/test.js?ref=5895325eeffebdcaae991ae28dcf0ce68b7abe89"
        ).reply(200, rawFile);
      }

      // Update check run
      n.patch(repo + "/check-runs/1234", body => {
        expect(body).to.include.keys(["started_at", "completed_at"]);
        body.started_at = "2018-10-05T17:35:21.594Z";
        body.completed_at = "2018-10-05T17:35:53.683Z";
        expect(body).to.eql(checkStatusCompleted, "updating check run");
        return true;
      }).reply(200);

      // Receive a webhook event
      await probot.receive({ name: `pull_request.${action}`, payload });

      // Make sure it actually did all the steps
      expect(n.isDone()).to.be.true;
    };

    describe("Non-matching files", () => {
      // Requiring our fixtures
      const checkStatusSuccess = require("../fixtures/non-matching/check_status.success");
      const changedFiles = require("../fixtures/non-matching/changedFiles");

      it("creates a passing check", () =>
        checkRun(checkStatusSuccess, changedFiles));
    });

    describe("Matching files", () => {
      const changedFiles = require("../fixtures/matching/changedFiles");

      describe("That contain .only", () => {
        const checkStatusFailure = require("../fixtures/matching/containing/check_status.failure");
        const rawFile = fs.readFileSync(
          path.join(__dirname, "../fixtures/invalid/it.only.js")
        );

        it("creates a failing check", () =>
          checkRun(checkStatusFailure, changedFiles, rawFile));
      });

      describe("That do not contain .only", () => {
        const checkStatusSuccess = require("../fixtures/matching/missing/check_status.success");
        const rawFile = fs.readFileSync(
          path.join(__dirname, "../fixtures/valid/standard.js")
        );

        it("creates a passing check", () =>
          checkRun(checkStatusSuccess, changedFiles, rawFile));
      });
    });
  }
);
