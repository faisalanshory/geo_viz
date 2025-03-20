from flask import Flask, render_template, request, jsonify
import json
import os

app = Flask(__name__)

# Folder untuk menyimpan data GeoJSON yang diupload
UPLOAD_FOLDER = 'static/data'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/data')
def get_data():
    with open('static/data/sample.geojson') as f:
        data = json.load(f)
    return data

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if file and file.filename.endswith('.geojson'):
        try:
            data = json.loads(file.read())
            return jsonify(data)
        except Exception as e:
            return jsonify({'error': str(e)}), 400
    
    return jsonify({'error': 'Invalid file type'}), 400

if __name__ == '__main__':
    app.run(debug=True) 