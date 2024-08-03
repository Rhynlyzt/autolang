const express = require('express');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

app.use(express.json());

const generateNewId = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length: 12 }, () => characters[Math.floor(Math.random() * characters.length)]).join('');
};

const getCurrentTimestamp = () => Date.now();

const data = {};

const sendRequest = (requestData) => {
  return axios.post(
    'https://chatgpt4online.org/wp-json/mwai-ui/v1/chats/submit',
    requestData,
    {
      headers: {
        'Content-Type': 'application/json',
        'X-Wp-Nonce': '61707c1a6e',
        'Accept': 'application/json',
        'Origin': 'https://chatgpt4online.org',
        'Cookie': '_clck=1c81t4w%7C2%7Cfnz%7C0%7C1673; _ga_H5B8K0GFP0=GS1.1.1722589994.5.1.1722590013.41.0.0; _ga=GA1.1.1245746434.1722405874; __gads=ID=5ca99033e7f59dbc:T=1722405853:RT=1722589972:S=ALNI_MYC8LpaadinRt64veqkMqem9StuLQ; __gpi=UID=00000ec36a8b4fea:T=1722405853:RT=1722589972:S=ALNI_MZ6ht9wrP3qRvAXa0G2J3LtceRLWw; __eoi=ID=1611ea36f18aef36:T=1722405853:RT=1722589972:S=AA-AfjaTxQXcYfWFypNWheqTt-Y8; __gsas=ID=a04508684f6014fb:T=1722489650:RT=1722489650:S=ALNI_MZpJyO0HjrablbyGDVRv91JWjxoyA; _clsk=bse5vd%7C1722590012640%7C2%7C1%7Cr.clarity.ms%2Fcollect; mwai_session_id=66aca31b515df; FCNEC=%5B%5B%22AKsRol_NR6cdLgDb0i47BmmM3KwJ1VZw-OykqKEf0hGNQ6ar8LhLlXYl-OxzjovUhFGiSlCcrWDWQKS2baIbhW5lbY5-srgquN5M9mjHBH03P59fUjXJtq0GicsQXhrTxzKdozZPV88CGTzulVc9D-iO_2r_19UYCQ%3D%3D%22%5D%5D', 
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': 'https://chatgpt4online.org/',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'Te': 'trailers'
      },
      withCredentials: true
    }
  ).then(response => response.data.reply || 'No reply content')
    .catch(error => {
      console.error('Request Error:', error.message);
      throw error;
    });
};

app.get('/chat', (req, res) => {
  const { prompt, id, customId, link } = req.query;

  if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

  let sessionId = customId || id;
  let messagesArray = data[sessionId]?.messages || [];

  if (id && !data[id]) return res.status(404).json({ error: 'No data found for the given id' });
  if (customId && data[customId]) return res.status(400).json({ error: 'Custom ID already exists' });

  if (link) {
    const filePath = path.join(__dirname, generateNewId() + path.extname(link));

    axios.head(link)
      .then(headResponse => {
        const contentType = headResponse.headers['content-type'];
        if (!contentType || !contentType.startsWith('image/')) {
          throw new Error('The provided URL does not link to an image');
        }

        return axios({
          url: link,
          responseType: 'stream'
        });
      })
      .then(response => {
        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
        });
      })
      .then(() => {
        const form = new FormData();
        form.append('file', fs.createReadStream(filePath), path.basename(filePath));
        form.append('type', 'N/A');
        form.append('purpose', 'N/A');

        return axios.post(
          'https://chatgpt4online.org/wp-json/mwai-ui/v1/files/upload',
          form,
          {
            headers: { ...form.getHeaders(), 'Host': 'chatgpt4online.org', 'X-Wp-Nonce': '61707c1a6e' }
          }
        );
      })
      .then(uploadResponse => {
        if (!messagesArray.length) {
          sessionId = customId || generateNewId();
          messagesArray = [];
        }

        return sendRequest({
          botId: "default",
          customId: null,
          session: "N/A",
          chatId: generateNewId(),
          contextId: 58,
          messages: messagesArray,
          newMessage: prompt,
          newFileId: uploadResponse.data.data.id,
          stream: false
        }).then(replyContent => {
          data[sessionId] = {
            messages: [...messagesArray, {
              id: generateNewId(),
              role: "user",
              content: `![Uploaded Image](${uploadResponse.data.data.url})\n ${prompt}`,
              who: "User: ",
              timestamp: getCurrentTimestamp()
            }, {
              id: generateNewId(),
              role: "assistant",
              content: replyContent,
              who: "AI: ",
              timestamp: getCurrentTimestamp()
            }],
            timestamp: getCurrentTimestamp()
          };

          res.json({ id: sessionId, message: replyContent });
        });
      })
      .catch(error => {
        console.error('Error:', error.message);
        res.status(500).json({ error: 'An error occurred during the file processing' });
      })
      .finally(() => {
        fs.unlink(filePath, err => {
          if (err) console.error('Error deleting file:', err.message);
        });
      });
  } else {
    if (!messagesArray.length) {
      sessionId = customId || generateNewId();
      messagesArray = [];
    }

    sendRequest({
      botId: "default",
      customId: null,
      session: "N/A",
      chatId: generateNewId(),
      contextId: 58,
      messages: messagesArray,
      newMessage: prompt,
      newFileId: null,
      stream: false
    }).then(replyContent => {
      data[sessionId] = {
        messages: [...messagesArray, {
          id: generateNewId(),
          role: "user",
          content: prompt,
          who: "User: ",
          timestamp: getCurrentTimestamp()
        }, {
          id: generateNewId(),
          role: "assistant",
          content: replyContent,
          who: "AI: ",
          timestamp: getCurrentTimestamp()
        }],
        timestamp: getCurrentTimestamp()
      };

      res.json({ id: sessionId, message: replyContent });
    }).catch(error => {
      res.status(500).json({ error: 'An error occurred while processing the prompt' });
    });
  }
});

app.get('/clear', (req, res) => {
  const { id } = req.query;

  if (!id) return res.status(400).json({ error: 'ID is required to clear data' });
  if (!data[id]) return res.status(404).json({ error: 'No data found for the given id' });

  delete data[id];
  res.json({ message: `Data for id ${id} has been cleared` });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});