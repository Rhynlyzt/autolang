const axios = require('axios');
const tinyurl = require('tinyurl');
const fs = require('fs-extra');

module.exports.config = {
  name: "remini",
  version: "1.0.0",
  role: 0,
  credits: "convert by kramywhite",
  description: "Enhance your image",
  hasPrefix: false,
  aliases: ["remini"],
  usage: "[remini <image_url>]",
  countdown: 15
};

module.exports.run = async ({ api, event, args }) => {
  try {
    let imageUrl;

    if (event.type === "message_reply") {
      const replyAttachment = event.messageReply.attachments[0];

      if (["photo", "sticker"].includes(replyAttachment?.type)) {
        imageUrl = replyAttachment.url;
      } else {
        api.sendMessage("🔴 | 𝖬𝗎𝗌𝗍 𝗋𝖾𝗉𝗅𝗒 𝖺𝗇 𝗂𝗆𝖺𝗀𝖾.", event.threadID);
        return;
      }
    } else if (args[0]?.match(/(https?:\/\/.*\.(?:png|jpg|jpeg))/g)) {
      imageUrl = args[0];
    } else {
      api.sendMessage("🔴 |𝖬𝗎𝗌𝗍 𝗋𝖾𝗉𝗅𝗒 𝖺𝗇 𝗂𝗆𝖺𝗀𝖾 𝗈𝗋 𝗂𝗆𝖺𝗀𝖾 𝖴𝖱𝖫.", event.threadID);
      return;
    }

    const url = await tinyurl.shorten(imageUrl);
    const response = await axios.get(`https://www.api.vyturex.com/upscale?imageUrl=${url}`, { responseType: 'json' });

    api.sendMessage("🕧| 𝙴𝚗𝚑𝚊𝚗𝚌𝚒𝚗𝚐 𝙿𝚑𝚘𝚝𝚘 𝙿𝚕𝚎𝚊𝚜𝚎 𝚠𝚊𝚒𝚝...", event.threadID);

    const resultUrl = response.data.resultUrl;
    const imagePath = __dirname + '/enhanced_image.png';

    const imageResponse = await axios({
      url: resultUrl,
      method: 'GET',
      responseType: 'stream'
    });

    const writer = fs.createWriteStream(imagePath);
    imageResponse.data.pipe(writer);

    writer.on('finish', async () => {
      try {
        await api.sendMessage({
          attachment: fs.createReadStream(imagePath)
        }, event.threadID);

        fs.unlinkSync(imagePath);
      } catch (sendError) {
        console.error('Error sending image:', sendError);
        api.sendMessage("An error occurred while sending the image.", event.threadID);
      }
    });

    writer.on('error', (err) => {
      console.error('Stream writer error:', err);
      api.sendMessage("An error occurred while processing the request.", event.threadID);
    });

  } catch (error) {
    console.error('Error:', error);
    api.sendMessage("An error occurred while processing the request.", event.threadID);
  }
};
