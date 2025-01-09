from flask import Flask, request, jsonify
import os
import vertexai
from vertexai.generative_models import GenerativeModel, SafetySetting
from google.oauth2 import service_account
from dotenv import load_dotenv

app = Flask(__name__)

# Load environment variables
load_dotenv()

# Path to your service account key file
KEY_PATH = "path_to_your_JSON.json"

# Initialize Google Vertex AI with JSON credentials
credentials = service_account.Credentials.from_service_account_file(KEY_PATH)
vertexai.init(credentials=credentials, project="your-project-id", location="your-location")

# Define Generation Config and Safety Settings
generation_config = {
    "max_output_tokens": 8192,
    "temperature": 1,
    "top_p": 0.95,
}

safety_settings = [
    SafetySetting(
        category=SafetySetting.HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold=SafetySetting.HarmBlockThreshold.OFF
    ),
    SafetySetting(
        category=SafetySetting.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold=SafetySetting.HarmBlockThreshold.OFF
    ),
    SafetySetting(
        category=SafetySetting.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold=SafetySetting.HarmBlockThreshold.OFF
    ),
    SafetySetting(
        category=SafetySetting.HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold=SafetySetting.HarmBlockThreshold.OFF
    ),
]

# Predefined company context
COMPANY_CONTEXT = """
please provide the company information
"""

@app.route('/ask', methods=['POST'])
def handle_query():
    data = request.json
    user_query = data.get('query', '').strip()

    if not user_query:
        return jsonify({"error": "Query is required"}), 400

    prompt = f"{COMPANY_CONTEXT}\n\nUser Question: {user_query}"

    model = GenerativeModel("gemini-1.5-pro-002")

    responses = model.generate_content(
        [prompt],
        generation_config=generation_config,
        safety_settings=safety_settings,
        stream=True,
    )

    generated_text = ""
    for response in responses:
        generated_text += response.text

    # Organize the response into bullet points and sections
    organized_response = organize_response(generated_text)

    return jsonify({"answer": organized_response})


def organize_response(response):
    """
    Organizes the response into bullet points or sections for better clarity.
    """
    lines = response.split('\n')
    organized_lines = []
    for line in lines:
        if line.strip():
            organized_lines.append(f"- {line.strip()}")
    return '\n'.join(organized_lines)


if __name__ == '__main__':
    app.run(debug=True)
