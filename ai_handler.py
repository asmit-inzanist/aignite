import os
import io
from PIL import Image
import google.generativeai as genai

genai.configure(api_key=os.getenv('Gemini_Api_Key'))

model = genai.GenerativeModel('gemini-1.5-flash')

def find_img(prompt, image_data):
    try:
        if isinstance(image_data, bytes):
            image = Image.open(io.BytesIO(image_data))
        else:
            image = image_data
        response = model.generate_content([prompt, image])
        return response.text
    except Exception as e:
        return f"Error processing image: {e}"
