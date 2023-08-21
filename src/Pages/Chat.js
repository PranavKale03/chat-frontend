// ChatRoom.js
import React, { useEffect, useRef, useState } from "react";
import styles from "./a.module.css"; // Update the import path with the correct module CSS file
import io from "socket.io-client";
// import { baseUrl } from '../../App';

const Chat = () => {
  const [userName, setUserName] = useState(null);
  const [userId, setUserId] = useState(null);
  const [roomName, setRoomName] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [availableRooms, setAvailableRooms] = useState([]);

  const [socket, setSocket] = useState(null);

  // Replace the socket URL with your server URL

  const messageListRef = useRef(null);

  useEffect(() => {
    const socket = io("http://localhost:4242/");
    setSocket(socket);

    async function fetchRooms() {
      const userData = JSON.parse(localStorage.getItem("user"));
      const userId = "64dcd39fd9b954bc0e365499";
      setUserId(userId);
      setUserName("aryan");
      fetch("http://localhost:4242/api" + `/community/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ adminId: userId }),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          // console.log(response.json())
          return response.json();
        })
        .then((data) => {
          console.log(data);
          setAvailableRooms(data);
        })
        .catch((error) => {
          // Handle any errors here
          console.error("Error fetching data:", error);
        });
    }
    fetchRooms();
    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    console.log("effect");

    if (socket) {
      // Join the chat room on mount
      if (roomName) {
        socket.emit("joinRoom", roomName);
      }
      console.log("listning");
      // Listen for incoming messages from the server
      socket.on("chatMessage", handleIncomingMessage);

      socket.on("messageHistory", (history) => {
        setMessages(history);
        setLoading(false);
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [roomName]);

  const handleIncomingMessage = (message) => {
    setMessages((prevMessages) => [...prevMessages, message]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim() !== "") {
      const newMessage = {
        userName: userName,
        userId: userId,
        message: inputValue.trim(),
        timestamp: Date.now(),
      };
      socket.emit("chatMessage", newMessage, roomName);
      setInputValue("");
    }
  };
  const addDayBreaksToMessages = (messages) => {
    let modifiedMessages = [];
    let currentDate = null;
    console.log(messages);

    for (const message of messages) {
      const messageDate = new Date(message.timestamp).toLocaleDateString();

      if (messageDate !== currentDate) {
        currentDate = messageDate;
        modifiedMessages.push({ type: "dayBreak", date: messageDate });
      }

      modifiedMessages.push({ type: "message", ...message });
    }

    console.log(modifiedMessages);
    return modifiedMessages;
  };

  useEffect(() => {
    if (socket) {
      socket.on("messageSavedConfirmation", (msg) => {
        console.log(msg);
      });
    }
  }, [socket]);
  return (
    <div className={styles.chatRoom}>
      <div className={styles.chatSidebar}>
        <h2>Chat Rooms:</h2>
        {!availableRooms ? (
          <p>loading rooms :)</p>
        ) : availableRooms.length === 0 ? (
          <p>No rooms found</p>
        ) : (
          availableRooms.map((room) => (
            <div key={room._id}>
              <button
                className={styles.roomButton}
                onClick={() => setRoomName(room._id)}
                style={{
                  fontWeight: room === roomName ? "bold" : "normal",
                  backgroundColor:
                    room === roomName ? "#0065c4" : "var(--primary-blue)",
                }}
              >
                {room._id}
              </button>
            </div>
          ))
        )}
      </div>
      <div className={styles.chatArea}>
        <h2>Chat Room: {roomName || "Select a room"}</h2>
        {loading ? (
          messages ? (
            <p>Loading messages...</p>
          ) : (
            <p>choose a room </p>
          )
        ) : (
          <div className={styles.messageList} ref={messageListRef}>
            {addDayBreaksToMessages(messages).map((item, index) => (
              <React.Fragment key={index}>
                {item.type === "dayBreak" && (
                  <div className={styles.dayBreak}>
                    <hr />
                    <p>{item.date}</p>
                    <hr />
                  </div>
                )}
                {item.type === "message" && (
                  <div
                    className={
                      item.adminId === userId
                        ? `${styles.messageContainer} ${styles.userMessageContainer}`
                        : styles.messageContainer
                    }
                  >
                    <div
                      className={`${styles.messageBubble} ${
                        item.adminId === userId
                          ? styles.userMessageBubble
                          : styles.otherMessageBubble
                      }`}
                    >
                      <p className={styles.messageText}>{item.message}</p>
                      <p className={styles.messageInfo}>
                        {item.userName} -{" "}
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        )}
        <form className={styles.chatForm} onSubmit={handleSubmit}>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className={styles.chatFormInput}
            placeholder="Type your message..."
          />
          <button type="submit" className={styles.chatFormButton}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
