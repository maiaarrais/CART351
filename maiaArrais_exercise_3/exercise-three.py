from flask import Flask, render_template, request, jsonify
import os
from datetime import datetime

app = Flask(__name__)
UPLOAD_FOLDER = 'static/uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  

# Create necessary directories
os.makedirs('files', exist_ok=True)
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# the default route
@app.route("/")
def index():
    return render_template("index.html")

#*************************************************
# Task: CAPTURE & POST & FETCH & SAVE
@app.route("/t2")
def t2():
    return render_template("t2.html")

@app.route("/postDataFetch", methods=['POST'])
def postDataFetch():
    try:
        # Get the JSON data from the request
        data = request.get_json()
        app.logger.info(f"Received fortune data: {data}")
        
        # Create timestamp
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # Format the fortune data to save
        fortune_entry = f"""
{'='*60}
FORTUNE SAVED: {timestamp}
Fortune: {data.get('fortune', 'N/A')}
Lucky Numbers: {', '.join(map(str, data.get('luckyNumbers', [])))}
User Mood: {data.get('mood', 'N/A')}
Timestamp: {data.get('timestamp', 'N/A')}
{'='*60}
"""
        
        # Save to file
        with open('files/data.txt', 'a', encoding='utf-8') as f:
            f.write(fortune_entry)
        
        # Return success message
        return jsonify({
            "status": "success",
            "message": "Your fortune has been saved to the cosmic archive! 🌟",
            "timestamp": timestamp,
            "data_received": "yes"
        })
    
    except Exception as e:
        app.logger.error(f"Error: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "Oops! The fortune spirits are busy. Try again!",
            "data_received": "no"
        }), 500

#*************************************************
# run
if __name__ == '__main__':
    app.run(debug=True)