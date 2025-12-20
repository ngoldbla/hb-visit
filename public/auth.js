/**
 * HatchBridge Auth Page JavaScript
 * Handles login/registration with role switching and phone input
 */

(function () {
    'use strict';

    // State
    let currentMode = 'login'; // 'login' or 'register'
    let currentRole = 'Visitor';
    let isSubmitting = false;

    // DOM Elements
    const authForm = document.getElementById('authForm');
    const modeBtns = document.querySelectorAll('.mode-btn');
    const roleTabs = document.querySelectorAll('.role-tab');
    const submitBtn = document.getElementById('submitBtn');
    const identifierLabel = document.getElementById('identifierLabel');
    const identifierHelper = document.getElementById('identifierHelper');
    const phoneInputWrapper = document.getElementById('phoneInputWrapper');
    const userIdInput = document.getElementById('userIdInput');
    const phoneInput = document.getElementById('phoneInput');
    const countryCode = document.getElementById('countryCode');
    const passwordInput = document.getElementById('passwordInput');
    const confirmPasswordInput = document.getElementById('confirmPasswordInput');
    const nameInput = document.getElementById('nameInput');
    const authError = document.getElementById('authError');
    const errorMessage = document.getElementById('errorMessage');
    const errorAction = document.getElementById('errorAction');
    const authSuccess = document.getElementById('authSuccess');
    const successMessage = document.getElementById('successMessage');
    const capsWarning = document.getElementById('capsWarning');
    const registerOnlyFields = document.querySelectorAll('.register-only');
    const loginPrompt = document.querySelector('.login-prompt');
    const registerPrompt = document.querySelector('.register-prompt');
    const switchToRegister = document.getElementById('switchToRegister');
    const switchToLogin = document.getElementById('switchToLogin');
    const goToLogin = document.getElementById('goToLogin');
    const loginIdentifierDisplay = document.getElementById('loginIdentifierDisplay');

    // Initialize
    document.addEventListener('DOMContentLoaded', init);

    function init() {
        setupEventListeners();
        updateFormForRole();
        updateFormForMode();
        validateForm();
    }

    function setupEventListeners() {
        // Mode toggle
        modeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                setMode(btn.dataset.mode);
            });
        });

        // Role tabs
        roleTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                setRole(tab.dataset.role);
            });
        });

        // Form submission
        authForm.addEventListener('submit', handleSubmit);

        // Input validation
        phoneInput.addEventListener('input', handlePhoneInput);
        userIdInput.addEventListener('input', validateForm);
        passwordInput.addEventListener('input', validateForm);
        confirmPasswordInput.addEventListener('input', validateForm);
        nameInput.addEventListener('input', validateForm);

        // Password toggle
        document.querySelectorAll('.password-toggle').forEach(btn => {
            btn.addEventListener('click', function () {
                const input = this.previousElementSibling;
                const isPassword = input.type === 'password';
                input.type = isPassword ? 'text' : 'password';
                this.querySelector('.eye-icon').textContent = isPassword ? '🙈' : '👁️';
                this.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
            });
        });

        // Caps lock detection
        passwordInput.addEventListener('keyup', checkCapsLock);
        passwordInput.addEventListener('keydown', checkCapsLock);

        // Footer links
        switchToRegister.addEventListener('click', () => setMode('register'));
        switchToLogin.addEventListener('click', () => setMode('login'));

        // Modal login button
        goToLogin.addEventListener('click', () => {
            $('#confirmationModal').modal('hide');
            setMode('login');
        });
    }

    function setMode(mode) {
        currentMode = mode;

        // Update mode buttons
        modeBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });

        updateFormForMode();
        clearMessages();
        validateForm();
    }

    function setRole(role) {
        currentRole = role;

        // Update role tabs
        roleTabs.forEach(tab => {
            const isActive = tab.dataset.role === role;
            tab.classList.toggle('active', isActive);
            tab.setAttribute('aria-selected', isActive);
        });

        updateFormForRole();
        clearMessages();
        validateForm();
    }

    function updateFormForMode() {
        const isLogin = currentMode === 'login';

        // Toggle register-only fields
        registerOnlyFields.forEach(field => {
            field.style.display = isLogin ? 'none' : 'block';
        });

        // Update submit button text
        submitBtn.querySelector('.btn-text').textContent = isLogin ? 'Login' : 'Create Account';

        // Update footer prompts
        loginPrompt.style.display = isLogin ? 'block' : 'none';
        registerPrompt.style.display = isLogin ? 'none' : 'block';

        // Reset password confirm
        confirmPasswordInput.value = '';

        // Hide role tabs for registration of non-visitors (visitors only can self-register)
        if (!isLogin && currentRole !== 'Visitor') {
            setRole('Visitor');
        }

        // Show/hide role tabs based on mode
        const roleTabsContainer = document.querySelector('.role-tabs');
        if (!isLogin) {
            // Only Visitor can register themselves
            roleTabsContainer.querySelectorAll('.role-tab').forEach(tab => {
                tab.style.display = tab.dataset.role === 'Visitor' ? 'flex' : 'none';
            });
        } else {
            roleTabsContainer.querySelectorAll('.role-tab').forEach(tab => {
                tab.style.display = 'flex';
            });
        }
    }

    function updateFormForRole() {
        const isVisitor = currentRole === 'Visitor';

        // Update identifier label
        if (isVisitor) {
            identifierLabel.textContent = 'Mobile number';
            identifierHelper.textContent = currentMode === 'login'
                ? 'Use the same number you registered with'
                : 'You\'ll use this number to log in';
            identifierHelper.style.display = 'block';
        } else {
            identifierLabel.textContent = 'Staff User ID';
            identifierHelper.style.display = 'none';
        }

        // Toggle phone vs text input
        phoneInputWrapper.style.display = isVisitor ? 'flex' : 'none';
        userIdInput.style.display = isVisitor ? 'none' : 'block';

        // Clear inputs when switching
        phoneInput.value = '';
        userIdInput.value = '';
    }

    function handlePhoneInput(e) {
        // Format as user types (simple formatting)
        let value = e.target.value.replace(/\D/g, '');

        if (value.length > 0) {
            if (value.length <= 3) {
                value = `(${value}`;
            } else if (value.length <= 6) {
                value = `(${value.slice(0, 3)}) ${value.slice(3)}`;
            } else {
                value = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6, 10)}`;
            }
        }

        e.target.value = value;
        validateForm();
    }

    function getIdentifier() {
        if (currentRole === 'Visitor') {
            const country = countryCode.value;
            const phone = phoneInput.value.replace(/\D/g, '');
            return country.replace('+', '') + phone;
        }
        return userIdInput.value.trim();
    }

    function validateForm() {
        let isValid = true;

        // Identifier validation
        const identifier = getIdentifier();
        if (currentRole === 'Visitor') {
            const phoneDigits = phoneInput.value.replace(/\D/g, '');
            if (phoneDigits.length < 7) {
                isValid = false;
            }
        } else {
            if (!identifier || identifier.length < 2) {
                isValid = false;
            }
        }

        // Password validation
        if (!passwordInput.value || passwordInput.value.length < 1) {
            isValid = false;
        }

        // Register-specific validations
        if (currentMode === 'register') {
            // Name required
            if (!nameInput.value.trim()) {
                isValid = false;
            }

            // Password confirmation
            if (passwordInput.value !== confirmPasswordInput.value) {
                isValid = false;
            }
        }

        // Update submit button
        submitBtn.disabled = !isValid || isSubmitting;
        return isValid;
    }

    function checkCapsLock(e) {
        const isCapsLock = e.getModifierState && e.getModifierState('CapsLock');
        capsWarning.style.display = isCapsLock ? 'block' : 'none';
    }

    function clearMessages() {
        authError.style.display = 'none';
        authSuccess.style.display = 'none';
        errorAction.style.display = 'none';
    }

    function showError(message, action = null, actionText = null) {
        errorMessage.textContent = message;
        authError.style.display = 'flex';
        authSuccess.style.display = 'none';

        if (action && actionText) {
            errorAction.textContent = actionText;
            errorAction.onclick = action;
            errorAction.style.display = 'inline';
        } else {
            errorAction.style.display = 'none';
        }
    }

    function showSuccess(message) {
        successMessage.textContent = message;
        authSuccess.style.display = 'block';
        authError.style.display = 'none';
    }

    function setLoading(loading) {
        isSubmitting = loading;
        submitBtn.disabled = loading;
        submitBtn.querySelector('.btn-text').style.display = loading ? 'none' : 'inline';
        submitBtn.querySelector('.btn-loading').style.display = loading ? 'flex' : 'none';
    }

    async function handleSubmit(e) {
        e.preventDefault();

        if (!validateForm() || isSubmitting) return;

        clearMessages();
        setLoading(true);

        try {
            if (currentMode === 'login') {
                await handleLogin();
            } else {
                await handleRegister();
            }
        } catch (error) {
            console.error('Auth error:', error);
            showError('An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    async function handleLogin() {
        const identifier = getIdentifier();

        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                role: currentRole,
                userId: identifier,
                password: passwordInput.value
            })
        });

        const data = await response.json();

        if (data.status === true && data.token) {
            // Success - store token and redirect
            localStorage.setItem('token', data.token);
            showSuccess('Login successful! Redirecting...');

            setTimeout(() => {
                // Redirect based on role
                if (currentRole === 'Visitor') {
                    window.location.href = '/';
                } else if (currentRole === 'Guard') {
                    window.location.href = '/';
                } else {
                    window.location.href = '/';
                }
            }, 1000);
        } else {
            // Handle specific error codes
            const errorMsg = data.error || data.message || 'Login failed';

            if (data.errorCode === 'VISITOR_NOT_FOUND' || data.action === 'register') {
                showError(errorMsg, () => setMode('register'), 'Register now');
            } else {
                showError(errorMsg);
            }
        }
    }

    async function handleRegister() {
        const identifier = getIdentifier();

        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: nameInput.value.trim(),
                registered_mob: identifier,
                password: passwordInput.value
            })
        });

        const data = await response.json();

        if (data.status === true) {
            // Show confirmation modal
            loginIdentifierDisplay.textContent = data.loginIdentifier || ('+' + identifier);
            $('#confirmationModal').modal('show');

            // Reset form
            authForm.reset();
            validateForm();
        } else {
            showError(data.message || data.error || 'Registration failed');
        }
    }

})();
