import axios
from flask import Flask, request, jsonify

app = Flask(__name__)

API_KEY = "a6fc110c9e45e1"


@app.route('/', methods=['GET'])
def get_ip_and_location():

    ip = request.headers.get('X-Forwarded-For', request.remote_addr)

    print(f"🌐 Client's Public IP: {ip}")

    try:
        response = axios.get(f"https://ipinfo.io/{ip}/json?token={API_KEY}")
        data = response.json()
        data['ip'] = ip
        print("📍 Location Info:")
        for k, v in data.items():
            print(f"{k.capitalize()}: {v}")

        return jsonify(data)

    except Exception as e:
        return jsonify({
            'ip': ip,
            'error': str(e)
        })
