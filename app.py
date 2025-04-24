import os
import re
import time
from flask import Flask, render_template, request, jsonify, send_file, redirect, url_for
from gtts import gTTS
from dotenv import load_dotenv
import google.generativeai as genai
import uuid

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Configure the Gemini API
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
genai.configure(api_key=GOOGLE_API_KEY)

# Create an active chats dictionary
active_chats = {}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/chat')
def chat():
    return render_template('chat.html')

@app.route('/start_chat', methods=['POST'])
def start_chat():
    data = request.json
    role = data.get('role', 'Tutor')
    language = data.get('language', 'English')
    user_name = data.get('user_name', 'Student')
    
    # Generate a unique chat ID
    chat_id = str(uuid.uuid4())
    
    # Initialize the model
    model = genai.GenerativeModel('gemini-2.0-flash',
                  generation_config={
                    "temperature": 0.8,
                    "top_p": 0.5,
                    "top_k": 50,
                    "max_output_tokens": 500,
                  })
    
    # Start a new chat
    chat = model.start_chat(history=[])
    
    # Set the role, language, and include the user's name
    if language.lower() in ["thai", "ไทย"]:
        instruction = f'''คุณเป็นผู้สอนที่เล่นบทบาทเป็น {role} และจะสื่อสารกับผู้ใช้ในภาษาไทย 
        ชื่อของนักเรียนคือ {user_name} ห้ามมีคำพรรณนาบอกอารมณ์ คำแสดงอากัปกิริยา คำบรรยายเสียง/พฤติกรรม หรือความคิดของบทบาทสมมติที่แสดงอยู่ 
        
        ควบคุมขั้นตอนการสนทนาดังต่อไปนี้:
        1. แนะนำตัวเองและทักทาย{user_name}เพื่อสร้างบรรยากาศที่ผ่อนคลาย 
        2. ถามเกี่ยวกับอารมณ์ของ{user_name}ในวันนี้ (เช่น "วันนี้อารมณ์เป็นอย่างไรบ้าง?") - รอการตอบจากผู้ใช้
        3. หลังจากที่ทราบอารมณ์แล้ว ให้ถามว่าวันนี้อยากเรียนเรื่องหรือวิชาอะไร - รอการตอบจากผู้ใช้
        4. เมื่อทราบวิชาแล้ว ให้ถามว่ามีความรู้พื้นฐานเรื่องนั้นหรือไม่
        5. ปรับการสอนตามอารมณ์ของ{user_name}: 
           - ถ้าอารมณ์เป็นบวก ให้สอนเต็มที่
           - ถ้าอารมณ์เป็นลบ ให้สอนสั้นกระชับ
           
        ห้ามถามเรื่องอื่นที่นอกเหนือจากอารมณ์จนกว่าผู้ใช้จะตอบคำถามเกี่ยวกับอารมณ์ก่อน
        ห้ามถามเรื่องวิชาที่สนใจจนกว่าจะทราบอารมณ์ของผู้ใช้ก่อน
        
        จำเป็นต้องทำประเมินหลังเรียน post test ดังนี้:
        - ถ้าอารมณ์บวกทำ 3 ข้อ
        - ถ้าอารมณ์ลบทำ 1 ข้อ
        ถามทีละคำถาม แล้วอธิบายคำตอบด้วย สุดท้ายปิดสรุปว่าวันนี้เรียนอะไรบ้าง'''
    else:  # Default to English
        instruction = f'''You are a tutor that role-plays as {role}. 
        The student's name is {user_name}. You must interact with {user_name} in English. 
        Avoid using descriptive language that conveys emotions, gestures, behaviors, sounds, or inner thoughts of any character involved.
        
        Control the conversation flow in this specific sequence:
        1. Introduce yourself and greet {user_name} to create a relaxed atmosphere.
        2. Ask specifically about {user_name}'s mood today (e.g., "How are you feeling today?") - wait for user's response.
        3. After learning about their mood, ask what subject or topic they would like to study today - wait for user's response.
        4. When the subject is identified, ask if they have prior knowledge about the topic.
        5. Adjust your teaching style based on {user_name}'s mood:
           - If the mood is positive, proceed with a full lesson.
           - If the mood is negative, keep the lesson brief and concise.
           
        Do not ask about anything else until the user has answered the mood question first.
        Do not ask about the subject until you know the user's mood.
        
        You must conduct a post-test as follows:
        - For a positive mood, include 3 questions
        - For a negative mood, include just 1 question
        Ask each question one at a time and explain the correct answer afterward. Finally, end the session with a summary of what was covered.'''
    
    # Send the instruction to set up the chat
    response = chat.send_message(instruction)
    
    # Store the chat in our active chats
    active_chats[chat_id] = {
        "chat": chat,
        "model": model,
        "language": language,
        "role": role,
        "user_name": user_name,
        "mood_asked": True,      # Flag to track if mood was asked
        "mood_answered": False,  # Flag to track if mood was answered
        "subject_asked": False,  # Flag to track if subject was asked
        "subject_answered": False # Flag to track if subject was answered
    }
    
    # Generate initial message from tutor
    response = chat.send_message(f"Please introduce yourself as the tutor to {user_name} and ask about their mood today.")
    
    # Clean the response text
    cleaned_response = clean_text(response.text)
    
    # Generate audio for the response
    audio_filename = generate_audio(cleaned_response, language)
    
    return jsonify({
        "chat_id": chat_id,
        "message": cleaned_response,
        "audio_url": f"/audio/{audio_filename}" if audio_filename else None
    })

@app.route('/send_message', methods=['POST'])
def send_message():
    data = request.json
    chat_id = data.get('chat_id')
    message = data.get('message')
    
    if chat_id not in active_chats:
        return jsonify({"error": "Chat session not found"}), 404
    
    chat_data = active_chats[chat_id]
    chat = chat_data["chat"]
    language = chat_data["language"]
    
    # Track conversation state
    if chat_data["mood_asked"] and not chat_data["mood_answered"]:
        # User is answering the mood question
        chat_data["mood_answered"] = True
        
        # Analyze mood from message (simple approach)
        positive_words = ["good", "great", "happy", "excellent", "fantastic", "wonderful", "amazing", 
                         "excited", "cheerful", "positive", "ดี", "สบาย", "มีความสุข", "สนุก", "ตื่นเต้น"]
        negative_words = ["bad", "sad", "tired", "upset", "angry", "stressed", "frustrated", "anxious",
                         "depressed", "negative", "แย่", "เศร้า", "เหนื่อย", "โกรธ", "เครียด"]
        
        # Simple mood detection based on keywords
        positive_match = any(word in message.lower() for word in positive_words)
        negative_match = any(word in message.lower() for word in negative_words)
        
        mood = "positive" if positive_match else "negative" if negative_match else "neutral"
        chat_data["mood"] = mood
        
        # Now ask about the subject
        prompt = f"The student has responded about their mood. Based on their response, their mood seems {mood}. Now ask what subject they would like to study today."
        
    elif chat_data["mood_answered"] and not chat_data["subject_asked"]:
        # Mark that we've asked about the subject
        chat_data["subject_asked"] = True
        prompt = f"The student has told you what subject they want to study. Ask if they have prior knowledge about this topic, and then begin teaching accordingly. Remember to adjust your teaching style based on their mood which seems {chat_data.get('mood', 'neutral')}."
        
    else:
        # Normal conversation flow
        prompt = message
    
    # Send the message to the AI
    response = chat.send_message(message)
    
    # Clean the response text
    cleaned_response = clean_text(response.text)
    
    # Generate audio for the response
    audio_filename = generate_audio(cleaned_response, language)
    
    if chat_data["mood_answered"] and not chat_data["subject_asked"]:
        chat_data["subject_asked"] = True
    elif chat_data["subject_asked"] and not chat_data["subject_answered"]:
        chat_data["subject_answered"] = True
    
    return jsonify({
        "message": cleaned_response,
        "audio_url": f"/audio/{audio_filename}" if audio_filename else None
    })

@app.route('/audio/<filename>')
def serve_audio(filename):
    return send_file(f"audio/{filename}", mimetype="audio/mp3")

def clean_text(text):
    # Remove asterisks or any other unwanted characters
    cleaned_text = re.sub(r'[*`]', '', text)
    return cleaned_text

def generate_audio(text, language='en'):
    if not text:
        return None
        
    if not text.strip():
        return None
    
    # Create audio directory if it doesn't exist
    os.makedirs("audio", exist_ok=True)
    
    # Determine language for gTTS
    tts_language = 'th' if language.lower() in ["thai", "ไทย"] else 'en'
    
    try:
        # Generate a unique filename
        filename = f"{uuid.uuid4()}.mp3"
        filepath = os.path.join("audio", filename)
        
        # Generate speech from text
        tts = gTTS(text=text, lang=tts_language, slow=False)
        tts.save(filepath)
        
        return filename
    except Exception as e:
        print(f"Error generating speech: {str(e)}")
        return None

if __name__ == '__main__':
    app.run(debug=True)