document.addEventListener('DOMContentLoaded', () => {
    // Get session data from localStorage
    const sessionData = JSON.parse(localStorage.getItem('tutorSessionData')) || {
        userName: 'Student',
        language: 'English',
        tutorRole: 'Friendly Teacher'
    };

    // DOM elements
    const userNameDisplay = document.getElementById('user-name-display');
    const tutorRoleDisplay = document.getElementById('tutor-role-display');
    const messagesContainer = document.getElementById('messages');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const endSessionBtn = document.getElementById('end-session-btn');

    // Sound settings elements
    const soundSettingsToggle = document.getElementById('sound-settings-toggle');
    const audioSettingsPanel = document.getElementById('audio-settings-panel');
    const autoplayToggle = document.getElementById('autoplay-toggle');
    const typingAnimationToggle = document.getElementById('typing-animation-toggle');
    const soundIcon = document.getElementById('sound-icon');

    // Create welcome screen element
    const welcomeScreen = document.createElement('div');
    welcomeScreen.className = 'welcome-screen';
    messagesContainer.appendChild(welcomeScreen);

    let chatId = null;
    let currentAudio = null;
    let audioQueue = [];
    let isPlayingAudio = false;
    let autoplayEnabled = true;
    let typingAnimationEnabled = true;
    const PLAYBACK_SPEED = 1.25; // Set default playback speed

    // Display user info
    userNameDisplay.textContent = sessionData.userName;
    tutorRoleDisplay.textContent = `${sessionData.tutorRole} (${sessionData.language})`;

    // Initialize settings from localStorage (if available)
    if (localStorage.getItem('autoplayEnabled') !== null) {
        autoplayEnabled = localStorage.getItem('autoplayEnabled') === 'true';
        autoplayToggle.checked = autoplayEnabled;
    }

    if (localStorage.getItem('typingAnimationEnabled') !== null) {
        typingAnimationEnabled = localStorage.getItem('typingAnimationEnabled') === 'true';
        typingAnimationToggle.checked = typingAnimationEnabled;
    }

    updateSoundIcon();

    // Toggle audio settings panel
    soundSettingsToggle.addEventListener('click', () => {
        audioSettingsPanel.classList.toggle('show');
        // Close panel when clicking elsewhere
        if (audioSettingsPanel.classList.contains('show')) {
            setTimeout(() => {
                document.addEventListener('click', closeSettingsPanel);
            }, 10);
        }
    });

    // Function to close settings panel when clicking outside
    function closeSettingsPanel(e) {
        if (!audioSettingsPanel.contains(e.target) && e.target !== soundSettingsToggle) {
            audioSettingsPanel.classList.remove('show');
            document.removeEventListener('click', closeSettingsPanel);
        }
    }

    // Handle autoplay toggle
    autoplayToggle.addEventListener('change', () => {
        autoplayEnabled = autoplayToggle.checked;
        localStorage.setItem('autoplayEnabled', autoplayEnabled);
        updateSoundIcon();

        // If autoplay was just enabled and we have audio in queue, play it
        if (autoplayEnabled && audioQueue.length > 0 && !isPlayingAudio) {
            playNextAudio();
        }
    });

    // Handle typing animation toggle
    typingAnimationToggle.addEventListener('change', () => {
        typingAnimationEnabled = typingAnimationToggle.checked;
        localStorage.setItem('typingAnimationEnabled', typingAnimationEnabled);
    });

    function updateSoundIcon() {
        soundIcon.textContent = autoplayEnabled ? '🔊' : '🔇';
    }

    // End session button click handler
    endSessionBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to end this session?')) {
            localStorage.removeItem('tutorSessionData');
            window.location.href = '/';
        }
    });

    // Store references to all audio players and their buttons
    const audioPlayers = new Map(); // Maps audio element to their control buttons

    function createThinkingAnimation() {
        // Create container with the same class as tutor messages for consistent positioning
        const container = document.createElement('div');
        container.className = 'message tutor-message thinking-container';

        // Add the AI icon (similar to your existing code)
        const aiIcon = document.createElement('div');
        aiIcon.className = 'ai-icon';
        aiIcon.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10s10-4.48,10-10S17.52,2,12,2z M12,20c-4.41,0-8-3.59-8-8s3.59-8,8-8s8,3.59,8,8S16.41,20,12,20z M13,9.94L14.06,11l1.06-1.06L16.18,11l1.06-1.06l-2.12-2.12L13,9.94z M8.88,9.94L9.94,11L11,9.94L8.88,7.82L6.76,9.94L7.82,11L8.88,9.94z M12,17.5c2.33,0,4.31-1.46,5.11-3.5H6.89C7.69,16.04,9.67,17.5,12,17.5z"/></svg>';

        // Create thinking dots animation directly in the container (not nested in message-content)
        const thinkingDiv = document.createElement('div');
        thinkingDiv.className = 'ai-thinking-animation';

        // Add the pulse dots
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('div');
            dot.className = 'thinking-dot';
            thinkingDiv.appendChild(dot);
        }

        // Build the structure - different order: put the thinking animation after the icon
        container.appendChild(aiIcon);
        container.appendChild(thinkingDiv); // Add directly to container, not inside message-content

        return container;
    }

    function showThinkingAnimation() {
        // Remove any existing thinking animation first
        hideThinkingAnimation();

        // Create and add thinking animation to messages container
        const thinkingAnim = createThinkingAnimation();
        messagesContainer.appendChild(thinkingAnim);

        // Ensure it's visible by scrolling to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function hideThinkingAnimation() {
        const thinkingAnim = document.querySelector('.thinking-container');
        if (thinkingAnim) {
            thinkingAnim.remove();
        }
    }

    // Stop any playing audio
    function stopCurrentAudio() {
        if (currentAudio && !currentAudio.paused) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
            isPlayingAudio = false;

            const playButton = audioPlayers.get(currentAudio);
            if (playButton) {
                playButton.innerHTML = '<i class="material-icons">play_arrow</i>'; // Reset to play icon
            }
        }
    }

    // Audio playing function
    function playNextAudio() {
        if (audioQueue.length === 0 || isPlayingAudio || !autoplayEnabled) {
            return;
        }

        isPlayingAudio = true;
        const audio = audioQueue.shift();

        // Set current audio
        currentAudio = audio;

        // Set playback speed
        audio.playbackRate = PLAYBACK_SPEED;

        const playButton = audioPlayers.get(audio);
        if (playButton) {
            playButton.innerHTML = '<i class="material-icons">pause</i>'; // Set to pause icon before playing
        }

        // Play the audio
        audio.play().catch(err => {
            console.error('Error playing audio:', err);
            isPlayingAudio = false;

            // Reset button on error
            if (playButton) {
                playButton.innerHTML = '<i class="material-icons">play_arrow</i>';
            }

            playNextAudio(); // Try the next one
        });

        // When audio ends, play the next one
        audio.onended = () => {
            isPlayingAudio = false;

            // Reset button
            if (playButton) {
                playButton.innerHTML = '<i class="material-icons">play_arrow</i>';
            }

            playNextAudio();
        };

        // Also handle other ways the audio might stop
        audio.onpause = () => {
            // Only mark as not playing if actually paused (not just seeking)
            if (audio.paused) {
                isPlayingAudio = false;

                // Reset button
                if (playButton) {
                    playButton.innerHTML = '<i class="material-icons">play_arrow</i>';
                }
            }
        };
    }

    function createCustomAudioPlayer(audioUrl) {
        const containerDiv = document.createElement('div');
        containerDiv.className = 'custom-audio-player';

        // Create audio element (hidden)
        const audio = document.createElement('audio');
        audio.src = audioUrl;
        audio.className = 'audio-element';
        audio.style.display = 'none';

        // Set playback speed
        audio.playbackRate = PLAYBACK_SPEED;

        // Create play/pause button with Google Material Icons
        const playButton = document.createElement('button');
        playButton.className = 'play-button';
        playButton.innerHTML = '<i class="material-icons">play_arrow</i>'; // Use Material Icon

        // Store the reference to the button
        audioPlayers.set(audio, playButton);

        // Play/pause functionality
        playButton.addEventListener('click', () => {
            if (audio.paused) {
                // If a different audio is playing, stop it first
                if (currentAudio && currentAudio !== audio && !currentAudio.paused) {
                    currentAudio.pause();
                    currentAudio.currentTime = 0;
                    const prevButton = audioPlayers.get(currentAudio);
                    if (prevButton) {
                        prevButton.innerHTML = '<i class="material-icons">play_arrow</i>'; // Reset previous button
                    }
                }

                audio.play();
                playButton.innerHTML = '<i class="material-icons">pause</i>'; // Pause icon
                currentAudio = audio;
                isPlayingAudio = true;
            } else {
                audio.pause();
                playButton.innerHTML = '<i class="material-icons">play_arrow</i>'; // Play icon
                isPlayingAudio = false;
            }
        });

        audio.onplay = () => {
            playButton.innerHTML = '<i class="material-icons">pause</i>'; // Pause icon
        };

        audio.onpause = () => {
            playButton.innerHTML = '<i class="material-icons">play_arrow</i>'; // Play icon
        };

        audio.onended = () => {
            playButton.innerHTML = '<i class="material-icons">play_arrow</i>'; // Play icon
            isPlayingAudio = false;
            // Check if this was in the queue
            if (currentAudio === audio) {
                setTimeout(playNextAudio, 500); // Small delay before next audio
            }
        };

        // Add elements to container
        containerDiv.appendChild(audio);
        containerDiv.appendChild(playButton);

        return { containerDiv, audio };
    }

    // In the DOMContentLoaded event handler, add this at the top (after creating other constants):
    // Add Google Material Icons link to head
    const iconLink = document.createElement('link');
    iconLink.rel = 'stylesheet';
    iconLink.href = 'https://fonts.googleapis.com/icon?family=Material+Icons';
    document.head.appendChild(iconLink);

    // New typing animation function
    function animateTyping(element, text, callback) {
        if (!typingAnimationEnabled) {
            element.textContent = text;
            if (callback) callback();
            return;
        }

        const typingElement = document.createElement('div');
        typingElement.className = 'typing-text';
        element.appendChild(typingElement);

        // Split text into individual characters and create spans
        for (let i = 0; i < text.length; i++) {
            const charSpan = document.createElement('span');
            charSpan.textContent = text[i];
            typingElement.appendChild(charSpan);
        }

        const spans = typingElement.querySelectorAll('span');
        let currentChar = 0;

        // Calculate typing speed (faster for longer texts)
        const baseSpeed = 30; // base milliseconds per character
        const adjustedSpeed = Math.max(10, baseSpeed - (text.length / 50)); // speed up for long texts

        function revealNextChar() {
            if (currentChar < spans.length) {
                spans[currentChar].classList.add('visible');
                currentChar++;

                // Vary typing speed slightly for natural feel
                const randomVariation = Math.random() * 20 - 10; // -10 to +10ms
                const typingSpeed = adjustedSpeed + randomVariation;

                // Scroll to keep the typing visible
                messagesContainer.scrollTop = messagesContainer.scrollHeight;

                setTimeout(revealNextChar, typingSpeed);
            } else if (callback) {
                callback();
            }
        }

        setTimeout(revealNextChar, 30); // Start typing after a small delay
    }

    // Function to process paragraphs for the new typing animation - with sequential typing
    function processParagraphsForTyping(messageElement, text) {
        // Split text into paragraphs
        const paragraphs = text.split('\n').filter(p => p.trim().length > 0);

        // Start with the first paragraph
        function typeParagraphSequentially(index) {
            if (index >= paragraphs.length) {
                return; // All paragraphs have been typed
            }

            const p = document.createElement('p');
            messageElement.appendChild(p);

            // When a paragraph finishes typing, start the next one
            animateTyping(p, paragraphs[index], () => {
                // Small delay between paragraphs for more natural reading
                setTimeout(() => {
                    typeParagraphSequentially(index + 1);
                }, 300); // 300ms pause between paragraphs
            });
        }

        // Start the sequential typing with the first paragraph
        typeParagraphSequentially(0);
    }

    function addMessage(text, sender, audioUrl = null, withTypingAnimation = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;

        // Create a container for the message content (separate from audio controls)
        const messageContentDiv = document.createElement('div');
        messageContentDiv.className = 'message-content';
        messageDiv.appendChild(messageContentDiv);

        let audioContainer = null;
        let audioElement = null;

        // Handle typing animation for tutor messages
        if (sender === 'tutor' && withTypingAnimation && typingAnimationEnabled) {
            // Use the new paragraph-based typing animation
            processParagraphsForTyping(messageContentDiv, text);  // Changed to messageContentDiv

            // If there's audio, add it AFTER the message content
            if (audioUrl) {
                const { containerDiv, audio } = createCustomAudioPlayer(audioUrl);
                audioContainer = containerDiv;
                audioElement = audio;
                messageDiv.appendChild(containerDiv);  // Append to messageDiv, not messageContentDiv

                // If autoplay is enabled, add to queue
                if (autoplayEnabled) {
                    audioQueue.push(audio);
                    // Try to play if not already playing something
                    if (!isPlayingAudio) {
                        playNextAudio();
                    }
                }
            }
        } else {
            // Regular message without typing animation
            // Format text with paragraphs
            const formattedText = text.split('\n').map(line =>
                line.trim() ? `<p>${line}</p>` : '<br>'
            ).join('');

            messageContentDiv.innerHTML = formattedText;  // Changed to messageContentDiv

            // Add custom audio player if available for tutor messages
            if (audioUrl && sender === 'tutor') {
                const { containerDiv, audio } = createCustomAudioPlayer(audioUrl);
                audioContainer = containerDiv;
                audioElement = audio;
                messageDiv.appendChild(containerDiv);  // Append to messageDiv, not messageContentDiv

                // If autoplay is enabled, add to queue
                if (autoplayEnabled) {
                    audioQueue.push(audio);
                    // Try to play if not already playing something
                    if (!isPlayingAudio) {
                        playNextAudio();
                    }
                }
            }
        }

        messagesContainer.appendChild(messageDiv);

        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Properly define initializeChat function with the welcome screen implementation
    async function initializeChat() {
        messagesContainer.innerHTML = '';
        // Create welcome screen inside the messages container instead of appending to container
        const welcomeScreen = document.createElement('div');
        welcomeScreen.className = 'welcome-screen';

        messagesContainer.style.display = 'flex';
        messagesContainer.style.flexDirection = 'column';
        messagesContainer.style.alignItems = 'center';
        messagesContainer.style.justifyContent = 'center';
        messagesContainer.appendChild(welcomeScreen);

        const userName = sessionData.userName || 'Student';
        welcomeScreen.innerHTML = `
            <div class="loader-container">
                <div class="loader-spinner"></div>
            </div>
            <h1>Good day, ${userName}</h1>
            <h2>Let's wrestle some knowledge into our heads! 🤼‍♂️📖 </h2>
        `;

        // Instead of hiding messages container, add the welcome screen to it
        welcomeScreen.style.display = 'flex';
        // Keep message container visible
        messagesContainer.style.display = 'block';
        // Only hide input until welcome is done
        document.getElementById('input-container').style.display = 'none';

        try {
            // Request happens in background without showing thinking animation yet
            const response = await fetch('/start_chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    language: sessionData.language,
                    role: sessionData.tutorRole,
                    user_name: sessionData.userName
                })
            });

            const data = await response.json();
            chatId = data.chat_id;

            // Wait a bit to show welcome message before transitioning to chat
            setTimeout(() => {
                // Remove welcome screen from DOM
                welcomeScreen.remove();

                // Reset messagesContainer styles
                messagesContainer.style.display = 'block';
                messagesContainer.style.alignItems = '';
                messagesContainer.style.justifyContent = '';

                // Show chat interface and input
                document.getElementById('input-container').style.display = 'flex';

                // Display tutor's initial message with typing animation
                addMessage(data.message, 'tutor', data.audio_url, true);

                // Enable input
                userInput.disabled = false;
                sendBtn.disabled = false;
                userInput.focus();
            }, 1000); // Show welcome for 2.5 seconds before transitioning

        } catch (error) {
            console.error('Error starting chat:', error);
            // Show error
            welcomeScreen.remove();
            document.getElementById('input-container').style.display = 'flex';
            addMessage('Failed to start chat session. Please refresh the page or try again later.', 'system');
        }
    }

    // Send message
    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Function to handle sending messages
    async function sendMessage() {
        const userText = userInput.value.trim();
        if (!userText || !chatId) return;

        stopCurrentAudio();

        // Clear input and disable it while processing
        userInput.value = '';
        userInput.disabled = true;
        sendBtn.disabled = true;

        // Add user message to chat
        addMessage(userText, 'user');

        // Show thinking animation
        showThinkingAnimation();

        try {
            // Send message to server
            const response = await fetch('/send_message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    chat_id: chatId,
                    message: userText
                })
            });

            // Hide thinking animation
            hideThinkingAnimation();

            // Process response
            if (response.ok) {
                const data = await response.json();
                // Add tutor's response with typing animation
                addMessage(data.message, 'tutor', data.audio_url, true);
            } else {
                // Handle error
                addMessage('Sorry, there was an error processing your message. Please try again.', 'system');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            hideThinkingAnimation();
            //addMessage('Network error. Please check your connection and try again.', 'system');
        }

        // Re-enable input
        userInput.disabled = false;
        sendBtn.disabled = false;
        userInput.focus();
    }

    function addSendButtonIcon() {
        const sendBtn = document.getElementById('send-btn');

        // Clear any existing content
        sendBtn.innerHTML = '';

        // Add an icon (using Material Icons)
        const icon = document.createElement('i');
        icon.className = 'material-icons';
        icon.textContent = 'send';
        sendBtn.appendChild(icon);
    }

    // Global event listener to handle audio conflicts
    document.addEventListener('play', function (e) {
        // If the played element is an audio and it's not the current one
        if (e.target.tagName === 'AUDIO' && currentAudio !== e.target) {
            // Pause any other playing audio
            document.querySelectorAll('audio').forEach(audio => {
                if (audio !== e.target && !audio.paused) {
                    audio.pause();
                    audio.currentTime = 0;

                    const playButton = audioPlayers.get(audio);
                    if (playButton) {
                        playButton.innerHTML = '<i class="material-icons">play_arrow</i>'; // Reset to play icon
                    }
                }
            });

            currentAudio = e.target;
            isPlayingAudio = true;

            const playButton = audioPlayers.get(e.target);
            if (playButton) {
                playButton.innerHTML = '<i class="material-icons">pause</i>'; // Set to pause icon
            }
        }
    }, true); // Use capture phase
    
    addSendButtonIcon();
    // Initialize chat session - MUST be after the function is fully defined
    initializeChat();
});