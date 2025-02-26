/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { WebClient } from "@slack/web-api";
import dayjs from "dayjs";
import { DataNode } from "../page";

interface Users {
  [key: string]: string;
}

interface UserMessageCount {
  [key: string]: number;
}

const PERIOD_IN_DAYS = 30;

// Initialize Slack client with your Bot User OAuth Token
const token = process.env.SLACK_BOT_USER_TOKEN;
const client = new WebClient(token);

// Set the time range (e.g., last 30 days)
const now = dayjs();
const oldest = now.subtract(PERIOD_IN_DAYS, "day").unix();
const latest = now.unix();

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Function to fetch all public channels
async function fetchChannels() {
  const channels = [];
  let cursor: string | undefined;

  do {
    try {
      const response = await client.conversations.list({
        limit: 200,
        cursor: cursor,
        types: "public_channel",
      });

      if (!response.channels) {
        return;
      }

      const activeChannels = response.channels.filter(
        (channel) => !channel.is_archived && (channel.updated ?? 0) > oldest
      );
      channels.push(...activeChannels);
      cursor = response.response_metadata?.next_cursor;
    } catch (error: any) {
      if (error.data?.error === "ratelimited") {
        const retryAfter = error.headers["retry-after"] || 1;
        console.log(`Rate limited. Retrying after ${retryAfter} seconds...`);
        await delay(retryAfter * 1000);
      } else {
        console.error("Error fetching channels:", error);
        throw error;
      }
    }
  } while (cursor);

  return channels;
}

// Function to fetch messages from a channel within the time range
async function fetchMessages(channelId: string) {
  const messages = [];
  let cursor;

  do {
    try {
      const response = await client.conversations.history({
        channel: channelId,
        oldest: `${oldest}`,
        latest: `${latest}`,
        limit: 200,
        cursor: cursor,
      });
      if (!response.messages) {
        return;
      }
      messages.push(...response.messages);
      cursor = response.response_metadata?.next_cursor;
    } catch (error: any) {
      if (error.data?.error === "ratelimited") {
        const retryAfter = error.headers["retry-after"] || 1;
        console.log(`Rate limited. Retrying after ${retryAfter} seconds...`);
        await delay(retryAfter * 1000);
      } else {
        console.error("Error fetching messages:", JSON.stringify(error));
        //throw error;
      }
    }
  } while (cursor);

  return messages;
}

// Function to fetch user info
async function fetchUsers() {
  const users: Users = {};
  let cursor;

  do {
    try {
      const response = await client.users.list({
        limit: 200,
        cursor: cursor,
      });
      if (!response.members) {
        return;
      }

      response.members
        .filter((user) => user.is_admin)
        .forEach((user) => {
          const id = user.id as string;
          users[id] = user.profile?.display_name || user.name || "Unknown";
        });

      cursor = response.response_metadata?.next_cursor;
    } catch (error: any) {
      if (error.data?.error === "ratelimited") {
        const retryAfter = error.headers["retry-after"] || 1;
        console.log(`Rate limited. Retrying after ${retryAfter} seconds...`);
        await delay(retryAfter * 1000);
      } else {
        console.error("Error fetching users:", error);
        throw error;
      }
    }
  } while (cursor);

  return users;
}

// Function to fetch replies to a message
async function fetchReplies(channelId: string, threadTs: string) {
  const replies = [];
  let cursor;

  do {
    try {
      const response = await client.conversations.replies({
        channel: channelId,
        ts: threadTs,
        limit: 200,
        cursor: cursor,
      });
      if (!response.messages) {
        return;
      }
      replies.push(...response.messages);
      cursor = response.response_metadata?.next_cursor;
    } catch (error: any) {
      if (error.data?.error === "ratelimited") {
        const retryAfter = error.headers["retry-after"] || 1;
        console.log(`Rate limited. Retrying after ${retryAfter} seconds...`);
        await delay(retryAfter * 1000);
      } else {
        console.error("Error fetching replies:", error);
        throw error;
      }
    }
  } while (cursor);

  return replies;
}

let cache = { data: [] as DataNode[], timestamp: 0 };

// Main function to count messages per user
export async function countMessages(): Promise<DataNode[]> {
  // 1000 * 60 * 5 = 5 minutes
  if (cache.timestamp > Date.now() - 1000 * 60 * 5) {
    return cache.data;
  }
  try {
    const channels = (await fetchChannels()) ?? [];
    console.log("Channels found:", channels?.length);
    const users = (await fetchUsers()) ?? {};
    const userMessageCount: UserMessageCount = {};
    let i = 0;
    const allMessages = [];
    for (const channel of channels) {
      i++;
      console.log(
        `Processing channel ${i} of ${channels.length}: ${channel.name}`
      );
      if (!channel.id) {
        continue;
      }

      const messages = (await fetchMessages(channel.id)) ?? [];
      for (const message of messages) {
        if (message.user && users[message.user]) {
          if (!userMessageCount[message.user]) {
            userMessageCount[message.user] = 0;
          }
          userMessageCount[message.user]++;
          allMessages.push(message);

          // Fetch and count replies
          if (message.thread_ts) {
            const replies =
              (await fetchReplies(channel.id, message.thread_ts)) ?? [];
            for (const reply of replies) {
              if (reply.user && users[reply.user]) {
                if (!userMessageCount[reply.user]) {
                  userMessageCount[reply.user] = 0;
                }
                userMessageCount[reply.user]++;
                allMessages.push(reply);
              }
            }
          }
        }
      }
    }
    //console.log(JSON.stringify(allMessages));
    // Display the message counts
    const data = [];
    for (const [userId, count] of Object.entries(userMessageCount)) {
      data.push({ user: users[userId], messages: count });
    }

    const formattedData: DataNode[] = data
    .toSorted((a, b) => a.messages - b.messages)
    .map((item, index) => ({
      group: item.user,
      value: item.messages,
      id: "" + index,
    }));

    cache = { data: formattedData, timestamp: Date.now()};

    return formattedData; 
  } catch (error) {
    console.error("Error fetching data from Slack API:", JSON.stringify(error));
    return [];
  }
}
