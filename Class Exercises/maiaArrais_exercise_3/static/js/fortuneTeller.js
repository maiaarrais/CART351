
// fortunes are AI-generated 
const fortunes = [
        "A thrilling adventure awaits you in the digital realm.",
        "Your code will compile on the first try... eventually.",
        "The bug you're looking for is closer than you think.",
        "A surprise collaboration will lead to innovation.",
        "Your creativity will solve an impossible problem.",
        "Success is in the details you haven't noticed yet.",
        "A random encounter will change your perspective.",
        "The answer you seek is hidden in plain sight.",
        "Your next project will exceed all expectations.",
        "A small change today will create big results tomorrow.",
        "Trust your intuition; it knows the way forward.",
        "The universe is conspiring in your favor today.",
        "Your persistence will soon pay unexpected dividends.",
        "A mentor will appear when you least expect it.",
        "Your next idea will be your best idea.",
        "The path less traveled holds your greatest treasure.",
        "Your unique perspective is your superpower.",
        "A moment of clarity is approaching rapidly.",
        "Your energy attracts your tribe.",
        "The best is yet to come, trust the process."
    ];
    
    let currentFortune = '';
    let luckyNumbers = [];
    let selectedMood = '';
    let fortuneRevealed = false;
    
    const cookie = document.getElementById('cookie');
    const clickHint = document.getElementById('clickHint');
    const fortuneDisplay = document.getElementById('fortuneDisplay');
    const fortuneText = document.getElementById('fortuneText');
    const luckyNumbersEl = document.getElementById('luckyNumbers');
    const crackBtn = document.getElementById('crackBtn');
    const saveBtn = document.getElementById('saveBtn');
    const newCookieBtn = document.getElementById('newCookieBtn');
    
    // Generate random fortune
    function generateFortune() {
        currentFortune = fortunes[Math.floor(Math.random() * fortunes.length)];
        luckyNumbers = Array.from({length: 6}, () => Math.floor(Math.random() * 49) + 1);
        return {fortune: currentFortune, numbers: luckyNumbers};
    }
    
    // Crack cookie (click or button)
    function crackCookie() {
        if (fortuneRevealed) return;
        
        cookie.classList.add('cracked');
        clickHint.style.display = 'none';
        
        setTimeout(() => {
            cookie.classList.remove('cracked');
            const {fortune, numbers} = generateFortune();
            fortuneText.textContent = `"${fortune}"`;
            luckyNumbersEl.textContent = `🍀 Lucky Numbers: ${numbers.join(', ')}`;
            fortuneDisplay.classList.add('show');
            fortuneRevealed = true;
            crackBtn.style.display = 'none';
            newCookieBtn.style.display = 'inline-block';
        }, 500);
    }
    
    // Cookie click event
    cookie.addEventListener('click', crackCookie);
    
    // Crack button
    crackBtn.addEventListener('click', crackCookie);
    
    // Mood selection
    document.querySelectorAll('.mood-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');
            selectedMood = this.dataset.mood;
            saveBtn.disabled = false;
        });
    });
    
    // Save fortune
    saveBtn.addEventListener('click', async function() {
        if (!selectedMood) {
            showMessage('Please select a mood first! 😊', 'error');
            return;
        }
        
        const fortuneData = {
            fortune: currentFortune,
            luckyNumbers: luckyNumbers,
            mood: selectedMood,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent.substring(0, 50)
        };
        
        try {
            const response = await fetch('/postDataFetch', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(fortuneData)
            });
            
            const result = await response.json();
            
            if (result.status === 'success') {
                showMessage('✨ ' + result.message, 'success');
                saveBtn.disabled = true;
                saveBtn.textContent = '✓ Saved!';
            } else {
                showMessage(result.message || 'Error saving fortune', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showMessage('Failed to save fortune. Please try again!', 'error');
        }
    });
    
    // New cookie
    newCookieBtn.addEventListener('click', function() {
        fortuneDisplay.classList.remove('show');
        clickHint.style.display = 'block';
        crackBtn.style.display = 'inline-block';
        newCookieBtn.style.display = 'none';
        saveBtn.disabled = true;
        saveBtn.textContent = '💾 Save Fortune';
        fortuneRevealed = false;
        selectedMood = '';
        document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
    });
    
    // Display message
    function showMessage(text, type) {
        const messageDiv = document.getElementById('message');
        messageDiv.textContent = text;
        messageDiv.className = `show ${type}`;
        
        setTimeout(() => {
            messageDiv.classList.remove('show');
        }, 4000);
    }