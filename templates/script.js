console.log("script.js loaded!");

const textInput = document.getElementById('textInput');
const charCount = document.getElementById('charCount');
const analyzeBtn = document.getElementById('analyzeBtn');
const clearBtn = document.getElementById('clearBtn');
const loading = document.getElementById('loading');
const resultsSection = document.getElementById('resultsSection');

const API_URL = '/api/analyze';
const HEALTH_URL = '/api/health';

console.log("API URL:", API_URL);
console.log("Health URL:", HEALTH_URL);

window.addEventListener('DOMContentLoaded', async () => {
    console.log("Testing server connection...");
    
    try {
        const response = await fetch(HEALTH_URL);
        const data = await response.json();
        console.log("Server response:", data);
        
        if (data.status === 'healthy') {
            console.log("Server is connected!");
            document.body.insertAdjacentHTML('beforeend', 
                '<div style="position:fixed; top:10px; right:10px; background:green; color:white; padding:5px; border-radius:3px;">Connected</div>'
            );
        }
    } catch (error) {
        console.error("Server connection failed:", error);
        document.body.insertAdjacentHTML('beforeend', 
            '<div style="position:fixed; top:10px; right:10px; background:red; color:white; padding:5px; border-radius:3px;">Server Error</div>'
        );
        
        alert(`Cannot connect to server!\n\nMake sure Flask is running:\n1. Open terminal\n2. Run: python app.py\n3. Check for errors\n\nError: ${error.message}`);
    }
});

if (textInput && charCount) {
    textInput.addEventListener('input', function() {
        const count = this.value.length;
        charCount.textContent = count;
        if (analyzeBtn) {
            analyzeBtn.disabled = count < 10;
        }
    });
}

if (clearBtn) {
    clearBtn.addEventListener('click', function() {
        if (textInput) textInput.value = '';
        if (charCount) charCount.textContent = '0';
        if (resultsSection) resultsSection.style.display = 'none';
        if (analyzeBtn) analyzeBtn.disabled = true;
    });
}

if (analyzeBtn) {
    analyzeBtn.addEventListener('click', async function() {
        console.log("Analyze button clicked");
        
        if (!textInput) {
            alert("Text input not found!");
            return;
        }
        
        const text = textInput.value.trim();
        console.log("Text to analyze:", text.substring(0, 50) + "...");
        
        if (text.length < 10) {
            alert('Please enter at least 10 characters.');
            return;
        }
        
        if (loading) loading.style.display = 'block';
        if (resultsSection) resultsSection.style.display = 'none';
        
        try {
            console.log("📡 Sending request to:", API_URL);
            
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ 
                    text: text,
                    test: "test from frontend" 
                })
            });
            
            console.log("Response status:", response.status);
            console.log("Response headers:", [...response.headers.entries()]);
            
            const result = await response.json();
            console.log("Response data:", result);
            
            if (!response.ok) {
                throw new Error(result.error || `HTTP ${response.status}`);
            }
            
            displayResults(result);
            
        } catch (error) {
            console.error("Analysis failed:", error);
            alert(`Analysis failed:\n${error.message}\n\nCheck console for details.`);
            
            const mockResult = {
                class: Math.floor(Math.random() * 3),
                confidence: 75 + Math.random() * 20,
                probabilities: {
                    class_0: 0.3,
                    class_1: 0.3,
                    class_2: 0.4
                },
                test: "Using mock data - server offline"
            };
            displayResults(mockResult);
            
        } finally {
            if (loading) loading.style.display = 'none';
        }
    });
}

function displayResults(result) {
    console.log("Displaying results:", result);
    
    let classBadge = document.getElementById('classBadge');
    let confidenceFill = document.getElementById('confidenceFill');
    let confidenceValue = document.getElementById('confidenceValue');
    
    if (!classBadge) {
        console.warn("Results elements not found, creating them...");
        resultsSection.innerHTML = `
            <h2>Analysis Results</h2>
            <div class="result-card">
                <div class="classification">
                    <h3>Classification</h3>
                    <div class="class-badge" id="classBadge">Class ${result.class}</div>
                </div>
                <div class="confidence">
                    <h4>Confidence</h4>
                    <div class="confidence-bar">
                        <div class="confidence-fill" id="confidenceFill" style="width: ${result.confidence}%"></div>
                    </div>
                    <div class="confidence-value" id="confidenceValue">${result.confidence.toFixed(1)}%</div>
                </div>
                <div class="details">
                    <h4>Raw Result Data:</h4>
                    <pre style="background: white; padding: 10px; border-radius: 5px; overflow: auto;">
${JSON.stringify(result, null, 2)}
                    </pre>
                </div>
            </div>
        `;
    } else {
        const classNames = ['Hate Speech', 'Offensive Language', 'Neither'];
        const classColors = ['class-0', 'class-1', 'class-2'];
        
        classBadge.textContent = classNames[result.class];
        classBadge.className = `class-badge ${classColors[result.class]}`;
        
        if (confidenceFill) {
            confidenceFill.style.width = `${result.confidence}%`;
        }
        
        if (confidenceValue) {
            confidenceValue.textContent = `${result.confidence.toFixed(1)}%`;
        }
    }
    
    if (resultsSection) {
        resultsSection.style.display = 'block';
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }
}

if (textInput) {
    textInput.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'Enter' && analyzeBtn && !analyzeBtn.disabled) {
            analyzeBtn.click();
        }
    });
}

console.log("script.js setup complete!");