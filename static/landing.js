document.addEventListener('DOMContentLoaded', () => {
    const userName = document.getElementById('user-name');
    const languageSelect = document.getElementById('language-select');
    const customRoleInput = document.getElementById('custom-role-input');
    const startSessionBtn = document.getElementById('start-session-btn');
    const tutorOptions = document.querySelectorAll('.tutor-option');

    let selectedRole = null;

    // Handle tutor option selection
    tutorOptions.forEach(option => {
        option.addEventListener('click', () => {
            // Remove active class from all options
            tutorOptions.forEach(op => op.classList.remove('active'));

            // Add active class to selected option
            option.classList.add('active');

            // Store selected role
            selectedRole = option.getAttribute('data-role');

            // Clear custom role input when predefined role is selected
            customRoleInput.value = '';
        });
    });

    // Clear selected role when custom role input is used
    customRoleInput.addEventListener('input', () => {
        if (customRoleInput.value.trim() !== '') {
            tutorOptions.forEach(op => op.classList.remove('active'));
            selectedRole = null;
        }
    });

    // Function to start session
    const startSession = () => {
        const name = userName.value.trim();
        const language = languageSelect.value;
        const customRole = customRoleInput.value.trim();
        const role = customRole || selectedRole || 'Friendly Teacher';

        if (!name) {
            alert('Please enter your name to continue');
            return;
        }

        // Store session data in localStorage
        const sessionData = {
            userName: name,
            language: language,
            tutorRole: role
        };

        localStorage.setItem('tutorSessionData', JSON.stringify(sessionData));

        // Redirect to chat page
        window.location.href = '/chat';
    };

    // Start session button click handler
    startSessionBtn.addEventListener('click', startSession);

    // Add Enter key functionality to custom role input
    customRoleInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault(); // Prevent default form submission
            startSession();
        }
    });

    // Also add Enter key functionality to username input
    userName.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            startSession();
        }
    });
});