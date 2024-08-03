module.exports.config = {
    name: "chat",
    version: "1.0",
    description: "Command to turn on/off chat",
    guide: {
        en: "Turn on/off chat"
    },
    category: "box chat",
    countDown: 5,
    role: 0,
    author: "Developer"
};

module.exports.run = async ({ message, args, role, getLang, event, api }) => {
    const threadID = event.threadID;

    if (args[0] === "on") {
        if (role < 1) {
            return message.reply(getLang("onlyAdmin"));
        }
        global.zenLeaf = global.zenLeaf || {};
        global.zenLeaf[threadID] = global.zenLeaf[threadID] || {};
        global.zenLeaf[threadID].chatEnabled = true;
        message.reply("Chat off is now disabled. Members can now freely chat.");
    } else if (args[0] === "off") {
        if (role < 1) {
            return message.reply(getLang("onlyAdmin"));
        }
        global.zenLeaf = global.zenLeaf || {};
        global.zenLeaf[threadID] = global.zenLeaf[threadID] || {};
        global.zenLeaf[threadID].chatEnabled = false;
        message.reply("Chat off enabled. Members who chat will be kicked.");
    }
};

module.exports.onChat = async ({ message, event, api, getLang, role }) => {
    const threadID = event.threadID;
    const chatEnabled = global.zenLeaf[threadID]?.chatEnabled ?? true;

    if (!chatEnabled) {
        if (role < 1) {
            api.removeUserFromGroup(event.senderID, threadID, (err) => {
                if (err) {
                    console.error(err);
                }
            });
            message.reply("CHAT DETECTED | The group is currently on chat off. You have been kicked from the group.");
        }
    }
};
