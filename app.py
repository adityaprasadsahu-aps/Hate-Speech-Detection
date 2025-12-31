from flask import Flask, request, jsonify, render_template, send_from_directory
import joblib
import re
import os
import sys

print("="*60)
print("Starting Flask Application...")
print(f"Python version: {sys.version}")
print(f"Current directory: {os.getcwd()}")
print("="*60)

app = Flask(__name__)

try:
    model = joblib.load('hate_speech_model.pkl')
    print("Model loaded successfully!")
    model_status = "loaded"
except Exception as e:
    print(f"Error loading model: {e}")
    model = None
    model_status = "not loaded"

templates_path = os.path.join(os.getcwd(), 'templates')
print(f"\nChecking templates folder: {templates_path}")
if os.path.exists(templates_path):
    print("Files in templates folder:")
    for file in os.listdir(templates_path):
        print(f"  - {file}")
else:
    print("templates folder not found!")

def clean_text(text):
    """Clean text for prediction"""
    if not text:
        return ""
    text = re.sub(r'http\S+', ' URL ', text)
    text = re.sub(r'@\w+', ' USER ', text)
    text = text.lower().strip()
    return ' '.join(text.split())

@app.route('/')
def index():
    print(f"\nGET / - Serving index.html")
    try:
        return render_template('index.html')
    except Exception as e:
        print(f"Error rendering template: {e}")
        return f"Error: {e}", 500

@app.route('/style.css')
def serve_css():
    print(f"GET /style.css")
    try:
        return send_from_directory('templates', 'style.css')
    except Exception as e:
        print(f"Error serving CSS: {e}")
        return f"CSS not found", 404

@app.route('/script.js')
def serve_js():
    print(f"GET /script.js")
    try:
        return send_from_directory('templates', 'script.js')
    except Exception as e:
        print(f"Error serving JS: {e}")
        return f"JS not found", 404

@app.route('/api/health', methods=['GET'])
def health():
    print(f"GET /api/health")
    response = jsonify({
        'status': 'healthy' if model else 'model not loaded',
        'model_loaded': model is not None,
        'endpoints': ['/', '/style.css', '/script.js', '/api/health', '/api/analyze']
    })
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

@app.route('/api/analyze', methods=['POST', 'OPTIONS'])
def analyze():
    if request.method == 'OPTIONS':
        print(f"OPTIONS /api/analyze")
        response = jsonify({})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        return response
    
    print(f"POST /api/analyze")
    try:
        if model is None:
            return jsonify({'error': 'Model not loaded'}), 503
        
        data = request.json
        text = data.get('text', '') if data else ''
        
        if len(text.strip()) < 10:
            return jsonify({'error': 'Text too short'}), 400
        
        cleaned_text = clean_text(text)
        prediction = model.predict([cleaned_text])[0]
        
        confidence = 85.5
        confidences = {
            'class_0': 0.1 if prediction != 0 else 0.8,
            'class_1': 0.1 if prediction != 1 else 0.8,
            'class_2': 0.1 if prediction != 2 else 0.8
        }
        
        response = jsonify({
            'class': int(prediction),
            'confidence': confidence,
            'probabilities': confidences,
            'test': 'API is working!'
        })
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
        
    except Exception as e:
        print(f"Error in analyze: {e}")
        response = jsonify({'error': str(e), 'test': 'API error'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response, 500

if __name__ == '__main__':
    print("\n" + "="*60)
    print("Server starting...")
    print("Access at: http://127.0.0.1:5000")
    print("Test API: http://127.0.0.1:5000/api/health")
    print("="*60 + "\n")
    
    for port in [5000, 5001, 5002, 5003]:
        try:
            print(f"Trying port {port}...")
            app.run(debug=True, host='127.0.0.1', port=port, use_reloader=False)
            break
        except OSError as e:
            if "Address already in use" in str(e):
                print(f"Port {port} busy, trying next...")
                continue
            else:
                raise e