import os
from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
from werkzeug.utils import secure_filename
from flask_babel import Babel, _
import cv2
import numpy as np
import datetime
import csv

app = Flask(__name__)
app.config['BABEL_DEFAULT_LOCALE'] = 'en'
app.config['BABEL_TRANSLATION_DIRECTORIES'] = 'translations'
babel = Babel(app)

# Supported languages
LANGUAGES = {
    'en': 'English',
    'ta': 'Tamil',
    'hi': 'Hindi',
    'te': 'Telugu',
    'fr': 'French'
}

@babel.localeselector
def get_locale():
    return request.args.get('lang', 'en')

app.secret_key = 'secret_key'
UPLOAD_FOLDER = 'static/uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Load Caffe Model
age_net = cv2.dnn.readNetFromCaffe(
    'static/models/deploy_age.prototxt', 'static/models/age_net.caffemodel')
gender_net = cv2.dnn.readNetFromCaffe(
    'static/models/deploy_gender.prototxt', 'static/models/gender_net.caffemodel')

AGE_BUCKETS = ['(0-2)', '(4-6)', '(8-12)', '(15-20)', '(25-32)',
               '(38-43)', '(48-53)', '(60-100)']
GENDERS = ['Male', 'Female']

# Ensure folders exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs('static/images/backgrounds', exist_ok=True)

def predict_age_gender(image_path):
    frame = cv2.imread(image_path)
    blob = cv2.dnn.blobFromImage(
        frame, 1.0, (227, 227), (78.426337, 87.768914, 114.895847), swapRB=False)
    gender_net.setInput(blob)
    gender_preds = gender_net.forward()
    gender = GENDERS[gender_preds[0].argmax()]
    gender_conf = round(gender_preds[0].max()*100, 2)

    age_net.setInput(blob)
    age_preds = age_net.forward()
    age = AGE_BUCKETS[age_preds[0].argmax()]
    age_conf = round(age_preds[0].max()*100, 2)

    return age, age_conf, gender, gender_conf

@app.route('/')
def index():
    lang = request.args.get('lang', 'en')
    return render_template('index.html', lang=lang)

@app.route('/upload', methods=['POST'])
def upload():
    lang = request.args.get('lang', 'en')
    if 'image' not in request.files:
        flash(_('No file part'), 'danger')
        return redirect(request.url)
    file = request.files['image']
    if file.filename == '':
        flash(_('No selected file'), 'danger')
        return redirect(request.url)
    filename = secure_filename(file.filename)
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)

    age, age_conf, gender, gender_conf = predict_age_gender(filepath)

    # Now returning the result with language context
    return render_template('result.html', lang=lang, image_file=filepath, age=age, age_conf=age_conf,
                           gender=gender, gender_conf=gender_conf)

@app.route('/history')
def history():
    lang = request.args.get('lang', 'en')
    rows = []
    if os.path.exists('result.csv'):
        with open('result.csv', 'r') as f:
            reader = csv.reader(f)
            for row in reader:
                rows.append(row)
    return render_template('history.html', lang=lang, rows=rows)

@app.route('/submit_feedback', methods=['POST'])
def submit_feedback():
    rating = request.form.get('rating')
    comment = request.form.get('comment')
    lang = request.args.get('lang', 'en')
    with open('feedback.csv', 'a', newline='', encoding='utf-8-sig') as f:
        writer = csv.writer(f)
        writer.writerow([rating, comment, datetime.datetime.now()])
    flash(_('Feedback submitted!'), 'success')
    return redirect(url_for('index', lang=lang))

@app.route('/all_feedbacks')
def all_feedbacks():
    lang = request.args.get('lang', 'en')
    feedbacks = []
    if os.path.exists('feedback.csv'):
        with open('feedback.csv', 'r', encoding='utf-8-sig') as f:
            reader = csv.reader(f)
            for row in reader:
                feedbacks.append(row)
    return render_template('feedbacks.html', lang=lang, feedbacks=feedbacks)

@app.route('/live')
def live():
    lang = request.args.get('lang', 'en')
    return render_template('live.html', lang=lang)

@app.route('/report_error', methods=['POST'])
def report_error():
    message = request.form.get('error_message')
    lang = request.args.get('lang', 'en')
    with open('error_reports.csv', 'a', newline='') as f:
        writer = csv.writer(f)
        writer.writerow([message, datetime.datetime.now()])
    flash(_('Bug report submitted!'), 'success')
    return redirect(url_for('index', lang=lang))

@app.route('/benchmark')
def benchmark():
    lang = request.args.get('lang', 'en')
    return render_template('benchmark.html', lang=lang)

if __name__ == '__main__':
    app.run(debug=True)
