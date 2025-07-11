from flask import Flask, render_template, jsonify, request, send_file
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime, timedelta
import json
import math
import random
import requests
import csv
import io
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///sentiment.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
CORS(app)

# === MODELS ===
class Alert(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    coin_id = db.Column(db.String(50), nullable=False)
    coin_name = db.Column(db.String(100), nullable=False)
    alert_type = db.Column(db.String(20), nullable=False)
    condition = db.Column(db.String(10), nullable=False)
    threshold = db.Column(db.Float, nullable=False)
    enabled = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class SentimentData(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    coin_id = db.Column(db.String(50), nullable=False)
    timestamp = db.Column(db.DateTime, nullable=False)
    positive = db.Column(db.Float, nullable=False)
    negative = db.Column(db.Float, nullable=False)
    neutral = db.Column(db.Float, nullable=False)
    overall = db.Column(db.Float, nullable=False)
    confidence = db.Column(db.Float, nullable=False)
    volume_correlation = db.Column(db.Float, nullable=False)
    social_mentions = db.Column(db.Integer, nullable=False)
    news_sentiment = db.Column(db.Float, nullable=False)
    fear_greed_index = db.Column(db.Float, nullable=False)
    market_cap_influence = db.Column(db.Float, nullable=False)
    trading_volume_24h = db.Column(db.BigInteger, nullable=False)
    price_momentum = db.Column(db.Float, nullable=False)
    volatility_index = db.Column(db.Float, nullable=False)
    technical_indicators = db.Column(db.Text, nullable=False)
    market_context = db.Column(db.Text, nullable=False)
    sources = db.Column(db.Text, nullable=False)

# === API ===
class SentimentAPI:
    POPULAR_COINS = [
        {"id": "bitcoin", "name": "Bitcoin", "symbol": "BTC"},
        {"id": "ethereum", "name": "Ethereum", "symbol": "ETH"},
        {"id": "binancecoin", "name": "BNB", "symbol": "BNB"},
        {"id": "solana", "name": "Solana", "symbol": "SOL"},
        {"id": "cardano", "name": "Cardano", "symbol": "ADA"},
    ]

    @staticmethod
    def get_intervals(time_range):
        return {
            "1h": {"count": 60, "duration": 60},
            "6h": {"count": 72, "duration": 300},
            "1d": {"count": 24, "duration": 3600},
            "1w": {"count": 168, "duration": 3600},
        }.get(time_range, {"count": 24, "duration": 3600})

    @staticmethod
    def generate_realistic_sentiment(coin_id, time_range, current_price=None, price_change_24h=None):
        intervals = SentimentAPI.get_intervals(time_range)
        now = datetime.utcnow()
        data = []

        profile = {
            "base_positive": 50,
            "base_negative": 30,
            "volatility": 1.0
        }

        for i in range(intervals["count"]):
            timestamp = now - timedelta(seconds=i * intervals["duration"])
            overall = random.uniform(-20, 20)
            positive = max(0, min(100, 50 + overall + random.uniform(-10, 10)))
            negative = max(0, min(100, 50 - overall + random.uniform(-10, 10)))
            neutral = max(0, 100 - positive - negative)

            data_point = {
                "timestamp": timestamp.isoformat(),
                "positive": round(positive, 2),
                "negative": round(negative, 2),
                "neutral": round(neutral, 2),
                "overall": round(overall, 2),
                "confidence": round(random.uniform(0.5, 1.0), 2),
                "volume_correlation": round(random.uniform(0.1, 1.0), 2),
                "social_mentions": random.randint(100, 10000),
                "news_sentiment": round(random.uniform(-1, 1), 2),
                "fear_greed_index": round(random.uniform(0, 100), 1),
                "market_cap_influence": round(random.uniform(0.1, 1.0), 2),
                "trading_volume_24h": random.randint(1000000, 100000000),
                "price_momentum": round(random.uniform(-10, 10), 2),
                "volatility_index": round(random.uniform(0.1, 2.0), 2),
                "technical_indicators": json.dumps({
                    "rsi": round(random.uniform(0, 100), 2),
                    "macd": round(random.uniform(-2, 2), 2)
                }),
                "market_context": json.dumps({
                    "btc_dominance": round(random.uniform(30, 70), 2),
                    "market_phase": "bull"
                }),
                "sources": json.dumps({
                    "twitter": round(random.uniform(0, 100), 2),
                    "reddit": round(random.uniform(0, 100), 2),
                })
            }

            data.append(data_point)

        return data

# === ROUTES ===
@app.route('/')
def index():
    return render_template("index.html")

@app.route('/api/coins')
def get_coins():
    return jsonify(SentimentAPI.POPULAR_COINS)

@app.route('/api/coin/<coin_id>')
def get_coin_data(coin_id):
    try:
        response = requests.get(
            f"https://api.coingecko.com/api/v3/coins/markets",
            params={"vs_currency": "usd", "ids": coin_id}
        )

        if response.status_code != 200:
            return jsonify({"error": "Erro na API CoinGecko"}), 502

        data = response.json()
        if data:
            return jsonify(data[0])
        return jsonify({"error": "Coin not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/sentiment/<coin_id>')
def get_sentiment_data(coin_id):
    time_range = request.args.get('timeRange', '1d')
    current_price = request.args.get('currentPrice', type=float)
    price_change_24h = request.args.get('priceChange24h', type=float)
    try:
        data = SentimentAPI.generate_realistic_sentiment(coin_id, time_range, current_price, price_change_24h)
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# === SPA (REACT) 404 FALLBACK ===
@app.errorhandler(404)
def not_found(e):
    return render_template("index.html")

# === INIT ===
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, host="0.0.0.0", port=5000)
