const chatIcon = document.getElementById('chatIcon');
const chatbot = document.getElementById('chatbot');
const closeChat = document.getElementById('closeChat');
const messageForm = document.getElementById('messageForm');
const userInput = document.getElementById('userInput');
const chatbotMessages = document.getElementById('chatbotMessages');
const suggestionsContainer = document.createElement('div'); 
suggestionsContainer.id = 'suggestions-container';

let typingIndicator; // Variable to hold the typing indicator

// Open the chatbot when the icon is clicked
chatIcon.addEventListener('click', () => {
    chatbot.style.display = 'flex'; // Show chatbot
    chatIcon.style.display = 'none'; // Hide chat icon
});
closeChat.addEventListener('click', () => {
    chatbot.style.display = 'none'; 
    chatIcon.style.display = 'flex';
});

// Function to add a message to the chat window
function addMessage(message, isUser = false) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', isUser ? 'user-message' : 'bot-message');

    if (isUser) {
        messageElement.textContent = message; // Plain text for user messages
    } else {
        // Remove "1. " from the beginning of each paragraph
        const cleanedMessage = message.replace(/^1\.\s*/gm, '');
        messageElement.innerHTML = cleanedMessage;
    }

    chatbotMessages.appendChild(messageElement);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight; // Scroll to the latest message
}

// Function to show typing indicator
function showTypingIndicator() {
    console.log("Showing typing indicator...");
    typingIndicator = document.createElement('div');
    typingIndicator.classList.add('message', 'bot-message');
    typingIndicator.textContent = '...'; // Typing indicator text
    chatbotMessages.appendChild(typingIndicator);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight; // Scroll to the latest message
}

// Function to remove typing indicator
function removeTypingIndicator() {
    console.log("Removing typing indicator...");
    if (typingIndicator) {
        chatbotMessages.removeChild(typingIndicator);
        typingIndicator = null;
    }
}

async function sendMessageToServer(userMessage) {
    try {
        const response = await fetch('/ask', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: userMessage }),
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error sending message:', error);
        return { answer: "I'm sorry, something went wrong. Please try again later." };
    }
}

// Handle form submission for sending messages
messageForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Prevent form from refreshing the page
    const message = userInput.value.trim();
    if (message) {
        addMessage(message, true); // Display the user's message
        userInput.value = ''; // Clear the input field

        showTypingIndicator(); // Show typing indicator

        // Simulate a realistic delay for the bot response
        setTimeout(async () => {
            const serverResponse = await sendMessageToServer(message); // Fetch server response
            removeTypingIndicator(); // Remove typing indicator
            addMessage(serverResponse.answer); // Display the bot's response

            // Only ask follow-up question if suggestions are available
            if (serverResponse.suggestions && serverResponse.suggestions.length > 0) {
                askFollowUpQuestion(serverResponse.suggestions);
            }

            if (serverResponse.meeting_link) {
                addMessage(
                    `<a href="${serverResponse.meeting_link}" target="_blank">Click here to schedule a meeting</a>`
                );
            }

            chatbotMessages.appendChild(suggestionsContainer); // Add suggestions container
            chatbotMessages.scrollTop = chatbotMessages.scrollHeight; // Scroll to the latest content
        }, 1500); // Adjust this value to control the delay (in milliseconds)
    }
});

// Function to ask follow-up question
function askFollowUpQuestion(suggestions) {
    const followUpQuestion = "Do you want to know more?";
    const followUpElement = document.createElement('div');
    followUpElement.classList.add('message', 'bot-message');
    followUpElement.textContent = followUpQuestion;
    chatbotMessages.appendChild(followUpElement);

    const yesButton = document.createElement('button');
    yesButton.textContent = 'Yes';
    yesButton.className = 'suggestion-btn';
    yesButton.addEventListener('click', () => {
        handleSuggestions(suggestions); // Show suggestions from backend
    });

    const noButton = document.createElement('button');
    noButton.textContent = 'No';
    noButton.className = 'suggestion-btn';
    noButton.addEventListener('click', () => {
        addMessage("Thank you! Have a great day!");
    });

    suggestionsContainer.innerHTML = ''; // Clear previous suggestions
    suggestionsContainer.appendChild(yesButton);
    suggestionsContainer.appendChild(noButton);
    suggestionsContainer.classList.add('show'); // Show suggestions container

    chatbotMessages.scrollTop = chatbotMessages.scrollHeight; // Scroll to the latest content
}

// Function to handle and display suggestions
function handleSuggestions(suggestions) {
    console.log("Suggestions received:", suggestions);
    suggestionsContainer.innerHTML = ''; // Clear previous suggestions

    if (suggestions && suggestions.length > 0) {
        suggestions.forEach((suggestion) => {
            const suggestionBtn = document.createElement('button');
            suggestionBtn.className = 'suggestion-btn';
            suggestionBtn.textContent = suggestion;
            suggestionBtn.addEventListener('click', () => {
                addMessage(suggestion, true); // Display suggestion as a user message
                sendMessageToServer(suggestion).then((response) => {
                    addMessage(response.answer); // Display bot response
                    handleSuggestions(response.suggestions); // Update suggestions
                    chatbotMessages.appendChild(suggestionsContainer);
                    chatbotMessages.scrollTop = chatbotMessages.scrollHeight; // Scroll to latest content
                });
            });
            suggestionsContainer.appendChild(suggestionBtn); // Add button to container
        });

        // Add a "Book a Meeting" suggestion as the last item
        const meetingBtn = document.createElement('button');
        meetingBtn.className = 'suggestion-btn';
        meetingBtn.textContent = 'Book a Meeting';
        meetingBtn.addEventListener('click', () => {
            window.open('https://calendly.com/whitespaces-ai', '_blank'); // Open the meeting link in a new tab
        });

        suggestionsContainer.appendChild(meetingBtn); // Add the meeting link as a button
        suggestionsContainer.classList.add('show'); // Show suggestions container
    } else {
        suggestionsContainer.classList.remove('show'); // Hide suggestions container
    }
}