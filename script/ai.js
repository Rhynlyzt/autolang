const axios = require('axios');

module.exports.config = {

  name: 'ai',

  version: '1.0.0',

  role: 0,

  hasPrefix: false,

  aliases: ['chan'],

  description: "AI",

  usage: "ai [prompt]",

  credits: 'cttro',

  cooldown: 3,

};

module.exports.run = async function({ api, event, args }) {

  const prompt = args.join(" ");

  const userID = "100"; // Fixed uid

  if (!prompt) {

    api.sendMessage('𝗣𝗟𝗘𝗔𝗦𝗘 𝗣𝗥𝗢𝗩𝗜𝗗𝗘 𝗬𝗢𝗨𝗥 𝗤𝗨𝗘𝗦𝗧𝗜𝗢𝗡...', event.threadID, event.messageID);

    return;

  }

  api.sendMessage('🤖 𝗔𝗜 𝗔𝗦𝗦𝗜𝗦𝗧𝗔𝗡𝗧 𝗔𝗡𝗦𝗪𝗘𝗥𝗜𝗡𝗚 𝗬𝗢𝗨𝗥 𝗤𝗨𝗘𝗦𝗧𝗜𝗢𝗡 𝗣𝗟𝗘𝗔𝗦𝗘 𝗪𝗔𝗜𝗧...', event.threadID);

  const apiUrl = `https://markdevs-last-api-as2j.onrender.com/gpt4?prompt=${encodeURIComponent(prompt)}&uid=${encodeURIComponent(userID)}`;

  try {

    const response = await axios.get(apiUrl);

    const result = response.data;

    const aiResponse = result.gpt4;

    const responseTime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila', hour12: true });

    // Fetch user's name from Facebook using their ID

    api.getUserInfo(event.senderID, (err, ret) => {

      if (err) {

        console.error('Error fetching user info:', err);

        api.sendMessage('Error fetching user info.', event.threadID, event.messageID);

        return;

      }

      const userName = ret[event.senderID].name;

      const formattedResponse = `🤖 𝗔𝗜 𝗔𝗦𝗦𝗜𝗦𝗧𝗔𝗡𝗧\n━━━━━━━━━━━━━━━━━━\n${aiResponse}\n━━━━━━━━━━━━━━━━━━\n🗣𝗔𝘀𝗸𝗲𝗱 𝗕𝘆: ${userName}\n⏰ 𝗥𝗲𝘀𝗽𝗼𝗻𝗱 𝗧𝗶𝗺𝗲: ${responseTime}`;

      api.sendMessage(formattedResponse, event.threadID, event.messageID);

    });

  } catch (error) {

    console.error('Error:', error);

    api.sendMessage('Error: ' + error.message, event.threadID, event.messageID);

  }

};