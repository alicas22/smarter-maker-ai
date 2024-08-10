"use client";

import { useState } from "react";
import { Box, Stack, TextField, Button, Typography, IconButton } from "@mui/material";
import { PieChartIcon } from "@radix-ui/react-icons";
import SendIcon from '@mui/icons-material/Send';

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Hi I'm the D&D Support Agent, how can I assist you today?`,
    },
  ]);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  // Function to handle sending messages in the chat
  const sendMessage = async () => {
    setMessage("");
    setMessages((messages) => [
      ...messages,
      { role: "user", content: message },
      { role: "assistant", content: "" },
    ]);
    const response = fetch("api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify([...messages, { role: "user", content: message }]),
    }).then(async (res) => {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      let result = "";
      return reader.read().then(function processText({ done, value }) {
        if (done) {
          return result;
        }
        const text = decoder.decode(value || new Int8Array(), { stream: true });
        setMessages((messages) => {
          let lastMessage = messages[messages.length - 1];
          let otherMessages = messages.slice(0, messages.length - 1);
          return [
            ...otherMessages,
            {
              ...lastMessage,
              content: lastMessage.content + text,
            },
          ];
        });
        return reader.read().then(processText);
      });
    });
  };

  // Function to handle creating an index and embeddings
  async function createIndexAndEmbeddings() {
    try {
      const result = await fetch('/api/setup', {
        method: "POST"
      });
      const json = await result.json();
      console.log('result: ', json);
    } catch (err) {
      console.log('err:', err);
    }
  }

  // Function to handle sending a query to the backend
  async function sendQuery() {
    const userQuery = { role: 'user', content: query };
    // console.log('userQuery:', userQuery);
    const newQueries = [ ...messages, userQuery, { role: "assistant", content: "" }];
    // console.log('messages:', newQueries);
    setMessages(newQueries);
    setQuery('');

    if (!query) return;

    setResult('');
    setLoading(true);

    try {
      const res = await fetch('/api/read', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(query),
      })
      // setLoading(false);
      if (!res.ok) {
        throw new Error(`Failed to retrieve response from /api/read: ${res.status}`);
      }
    } catch (err) {
      console.log('Failed to get response from /api/read, falling back to /api/chat:', err);
      // setLoading(false);

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify([...messages, { role: "user", content: query }]),
        });

        if (!res.ok) {
          throw new Error(`Failed to retrieve response from /api/chat: ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let result = '';

        await reader.read().then(function processText({ done, value }) {
          if (done) {
            setResult(result);
            return;
          }

          const text = decoder.decode(value || new Int8Array(), { stream: true });
          result += text;

          setMessages((messages) => {
            let lastMessage = messages[messages.length - 1];
            let otherMessages = messages.slice(0, messages.length - 1);
            return [
              ...otherMessages,
              {
                ...lastMessage,
                content: lastMessage.content + text,
              },
            ];
          });


          return reader.read().then(processText);
        });
      } catch (error) {
        console.error('Failed to retrieve response from /api/chat:', error);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      p={4} // Adding padding to ensure content doesn't touch edges
      sx={{
        background: 'linear-gradient(120deg, #2F4F4F, #36454F)',
    // padding: 2,
      }}
    >
      <Stack
        direction="column"
        width="60vw"
        height="80%" // Adjusting height to be dynamic based on content
        sx={{
          bgcolor: 'white',
          borderRadius: 8,
        }}
        p={3}
        spacing={3}
        justifyContent={'space-between'}
      >
        <Stack
          direction="column"
          spacing={2}
          flexGrow={1}
          overflow="auto"
        >
          {messages.map((message, index) => (
            <Box
              key={index}
              display="flex"
              justifyContent={
                message.role === "assistant" ? "flex-start" : "flex-end"
              }
            >
              <Box
                sx={{
                  bgcolor: message.role === 'assistant' ? 'primary.light' : 'secondary.main',
                  color: message.role === 'assistant' ? 'primary.dark' : 'white',
                  borderRadius: 4,
                  p: 2,
                  maxWidth: '75%',
                }}
              >
                <Typography
                  dangerouslySetInnerHTML={{ __html: message.content }}
                ></Typography>
                {/* {message.content} */}
              </Box>
            </Box>
          ))}
        </Stack>
        {/* <Stack direction="row" spacing={2}>
          <TextField
            label="message"
            fullWidth
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <Button variant="contained" onClick={sendMessage}>
            Send
          </Button>
        </Stack> */}

        <Stack direction="row" spacing={2}>
          <TextField
            label="Ask a question"
            fullWidth
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendQuery()}
          />
          <IconButton variant="contained"
            onClick={sendQuery}
            sx={{
              bgcolor: 'primary.dark',
              borderRadius: '50%',
              width: '56px',
              height: '56px',
              aspectRatio: 1,
              '&:hover': {
                cursor: 'pointer',
                backgroundColor: 'accent.main',
                borderRadius: '50%',
                color: 'primary.dark'
              },
              color: 'white'
            }}
          >
              <SendIcon
                sx={{
                  color: 'inherit',
                }}
              />
          </IconButton>
          {/* we will not have this be customer facing */}
          {/* <Button
            variant="outlined"
            onClick={createIndexAndEmbeddings}
          >
            Create Index and Embeddings
          </Button> */}
        </Stack>
      </Stack>
    </Box>
  );
}
