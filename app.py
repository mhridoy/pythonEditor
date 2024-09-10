from flask import Flask, request, jsonify
from flask_cors import CORS
import sys
import io

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "https://python-editor-rho.vercel.app"}})

@app.route('/execute', methods=['POST', 'OPTIONS'])
def execute_code():
    if request.method == 'OPTIONS':
        return '', 204
    code = request.json['code']
    output = io.StringIO()
    sys.stdout = output
    try:
        exec(code)
        result = output.getvalue()
    except Exception as e:
        result = str(e)
    finally:
        sys.stdout = sys.__stdout__
    return jsonify({'output': result})

if __name__ == '__main__':
    app.run(debug=True)
