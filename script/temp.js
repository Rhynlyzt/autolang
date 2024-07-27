const axios = require("axios");

module.exports.config = {
  name: "tempmail",
  version: "1.0",
  author: "ARN",
  role: 0,
  description: "retrieve emails and inbox messages",
  usage: "{pn} gen\n{pn} inbox (email)",
  cooldowns: 2,
};

module.exports.run = async ({ api, args, event }) => {
  const command = args[0];

  if (command === "gen") {
    try {
      const response = await axios.get("https://markdevs-last-api.onrender.com/api/gen");
      const email = response.data.email;
      return api.sendMessage(`𝗀𝖾𝗇𝖾𝗋𝖺𝗍𝖾𝖽 𝖾𝗆𝖺𝗂𝗅✉️: ${email}\n𝖼𝗁𝖾𝖼𝗄 𝗒𝗈𝗎𝗋 𝖾𝗆𝖺𝗂𝗅📬: 𝗍𝖾𝗆𝗉𝗆𝖺𝗂𝗅 𝗂𝗇𝖻𝗈𝗑 (𝖾𝗆𝖺𝗂𝗅)`, event.threadID);
    } catch (error) {
      console.error(error);
      return api.sendMessage("Failed to generate email.", event.threadID);
    }
  } else if (command === "inbox") {
    const email = args[1];

    if (!email) {
      return api.sendMessage("𝖯𝗋𝗈𝗏𝗂𝖽𝖾 𝖺𝗇 𝖾𝗆𝖺𝗂𝗅 𝖺𝖽𝖽𝗋𝖾𝗌𝗌 𝖿𝗈𝗋 𝗍𝗁𝖾 𝗂𝗇𝖻𝗈𝗑.", event.threadID);
    }

    try {
      const inboxResponse = await axios.get(`https://markdevs-last-api.onrender.com/api/getmessage/:email${email}`);
      const inboxMessages = inboxResponse.data;

      const formattedMessages = inboxMessages.map((message) => {
        return `${message.date} - 📬:From: ${message.sender}\n${message.message}`;
      });

      return api.sendMessage(`𝗂𝗇𝖻𝗈𝗑 𝗆𝖾𝗌𝗌𝖺𝗀𝖾 𝖿𝗈𝗋 ${email}:\n\n${formattedMessages.join("\n\n")}\n\nOld messages will be deleted after some time.`, event.threadID);

    } catch (error) {
      console.error(error);
      return api.sendMessage("𝖥𝖺𝗂𝗅𝖾𝖽 𝗍𝗈 𝗋𝖾𝗍𝗋𝗂𝖾𝗏𝖾 𝗂𝗇𝖻𝗈𝗑 𝗆𝖾𝗌𝗌𝖺𝗀𝖾.", event.threadID);
    }
  } else {
    return api.sendMessage("Invalid command. Use {pn} gen or {pn} inbox (email).", event.threadID);
  }
};