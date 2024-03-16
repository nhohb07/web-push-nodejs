const express = require("express");
const app = express();
const webpush = require("web-push");
const cors = require("cors");

const port = 8080;

const apiKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY,
};

webpush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL}`,
  apiKeys.publicKey,
  apiKeys.privateKey
);

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("It's work");
});

let subscriptions = [];

app.post("/subscriptions", (req, res) => {
  subscriptions.push(req.body);
  res.json({ status: "Success", message: "Subscription saved!" });
});

app.delete("/subscriptions", (req, res) => {
  subscriptions = [];
  res.json({ status: "Success", message: "Subscriptions cleared!" });
});

app.post("/notifications", async (req, res) => {
  console.log(subscriptions);

  if (!subscriptions.length) {
    res.json({
      status: "Failed",
      message: "No subscription available to send notification!",
    });

    return;
  }

  const sendNotificationPromises = subscriptions.map((subscription) => {
    return webpush
      .sendNotification(subscription, JSON.stringify(req.body))
      .then(() => true)
      .catch((error) => {
        console.error("webpush.sendNotification", {
          error: error,
          message: error.message,
          stack: error.stack,
        });

        return false;
      });
  });

  const result = await Promise.all(sendNotificationPromises);

  res.json({
    status: "Success",
    message: `${result.filter((i) => i).length}/${
      subscriptions.length
    } message(s) sent!`,
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}!`);
});
