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
from typing import List, Dict, Any

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///sentiment.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
CORS(app)

# Database Models
class Alert(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    coin_id = db.Column(db.String(50), nullable=False)
    coin_name = db.Column(db.String(100), nullable=False)
    alert_type = db.Column(db.String(20), nullable=False)  # positive, negative, overall
    condition = db.Column(db.String(10), nullable=False)  # above, below
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
    
    # Technical indicators (stored as JSON)
    technical_indicators = db.Column(db.Text, nullable=False)
    
    # Market context (stored as JSON)
    market_context = db.Column(db.Text, nullable=False)
    
    # Sources (stored as JSON)
    sources = db.Column(db.Text, nullable=False)

# Sentiment API Class
class SentimentAPI:
    POPULAR_COINS = [
        {"id": "bitcoin", "name": "Bitcoin", "symbol": "BTC"},
        {"id": "ethereum", "name": "Ethereum", "symbol": "ETH"},
        {"id": "binancecoin", "name": "BNB", "symbol": "BNB"},
        {"id": "solana", "name": "Solana", "symbol": "SOL"},
        {"id": "cardano", "name": "Cardano", "symbol": "ADA"},
    ]
    
    @staticmethod
    def get_intervals(time_range: str):
        intervals = {
            "1h": {"count": 60, "duration": 60},  # 1 minute intervals
            "6h": {"count": 72, "duration": 300},  # 5 minute intervals
            "1d": {"count": 24, "duration": 3600},  # 1 hour intervals
            "1w": {"count": 168, "duration": 3600},  # 1 hour intervals
        }
        return intervals.get(time_range, intervals["1d"])
    
    @staticmethod
    def generate_realistic_sentiment(coin_id: str, time_range: str, current_price: float = None, price_change_24h: float = None):
        intervals = SentimentAPI.get_intervals(time_range)
        data = []
        now = datetime.utcnow()
        
        # Base sentiment profiles for different coins
        coin_profiles = {
            "bitcoin": {"base_positive": 55, "base_negative": 25, "volatility": 0.8},
            "ethereum": {"base_positive": 50, "base_negative": 30, "volatility": 1.0},
            "binancecoin": {"base_positive": 45, "base_negative": 35, "volatility": 1.2},
            "solana": {"base_positive": 48, "base_negative": 32, "volatility": 1.5},
            "cardano": {"base_positive": 42, "base_negative": 38, "volatility": 1.1},
        }
        
        profile = coin_profiles.get(coin_id, coin_profiles["bitcoin"])
        
        for i in range(intervals["count"] - 1, -1, -1):
            timestamp = now - timedelta(seconds=i * intervals["duration"])
            
            # Create realistic market cycles and trends
            time_progress = i / intervals["count"]
            market_cycle = math.sin(time_progress * math.pi * 2) * 0.3
            trend_factor = math.cos(time_progress * math.pi * 4) * 0.2
            random_noise = (random.random() - 0.5) * 0.4
            
            # Price correlation factor
            price_correlation = math.tanh((price_change_24h or 0) / 10) * 15 if price_change_24h else 0
            
            # Calculate base sentiments with realistic factors
            positive = max(15, min(75, 
                profile["base_positive"] + 
                market_cycle * 20 + 
                trend_factor * 10 + 
                random_noise * profile["volatility"] * 15 + 
                price_correlation
            ))
            
            negative = max(10, min(60,
                profile["base_negative"] - 
                market_cycle * 15 - 
                trend_factor * 8 + 
                random_noise * profile["volatility"] * 12 - 
                price_correlation * 0.7
            ))
            
            neutral = max(10, 100 - positive - negative)
            overall = positive - negative
            
            # Generate additional ML-ready features
            confidence = max(0.3, min(1.0, 0.7 + (abs(overall) / 50) * 0.3 + (random.random() - 0.5) * 0.2))
            social_mentions = max(100, int(1000 + math.sin(time_progress * math.pi * 6) * 500 + random.random() * 300))
            fear_greed_index = max(0, min(100, 50 + overall * 0.8 + (random.random() - 0.5) * 20))
            
            # Technical indicators
            rsi = max(0, min(100, 50 + overall * 0.6 + (random.random() - 0.5) * 30))
            macd = (random.random() - 0.5) * 2 + overall * 0.02
            
            # Market context
            btc_dominance = max(40, min(70, 55 + math.sin(time_progress * math.pi * 3) * 8 + (random.random() - 0.5) * 6))
            market_phase = "bull" if overall > 15 else "bear" if overall < -15 else "sideways"
            
            data_point = {
                "timestamp": timestamp.isoformat(),
                "positive": round(positive, 1),
                "negative": round(negative, 1),
                "neutral": round(neutral, 1),
                "overall": round(overall, 1),
                "confidence": round(confidence, 3),
                "volume_correlation": round((0.3 + abs(overall) / 100), 3),
                "social_mentions": social_mentions,
                "news_sentiment": round(overall * 0.8 + (random.random() - 0.5) * 20, 1),
                "fear_greed_index": round(fear_greed_index, 1),
                "market_cap_influence": round((0.8 if coin_id == "bitcoin" else 0.3 + random.random() * 0.4), 3),
                "trading_volume_24h": int(1000000 + random.random() * 5000000),
                "price_momentum": round((price_change_24h or (random.random() - 0.5) * 10), 2),
                "volatility_index": round((profile["volatility"] + random.random() * 0.5), 3),
                "technical_indicators": {
                    "rsi": round(rsi, 1),
                    "macd": round(macd, 3),
                    "bollinger_position": round((0.5 + overall / 100 + (random.random() - 0.5) * 0.4), 3),
                    "volume_sma_ratio": round((1.0 + (random.random() - 0.5) * 0.6), 3),
                },
                "market_context": {
                    "btc_dominance": round(btc_dominance, 1),
                    "market_phase": market_phase,
                    "correlation_with_btc": round((1.0 if coin_id == "bitcoin" else 0.4 + random.random() * 0.5), 3),
                    "sector_sentiment": round((overall + (random.random() - 0.5) * 30), 1),
                },
                "sources": {
                    "twitter": round((positive * 0.4 + random.random() * 20), 1),
                    "reddit": round((positive * 0.3 + random.random() * 15), 1),
                    "telegram": round((positive * 0.2 + random.random() * 10), 1),
                    "news": round((positive * 0.6 + random.random() * 25), 1),
                    "trading_signals": round((overall + 50 + random.random() * 20), 1),
                }
            }
            
            data.append(data_point)
        
        return data

# Routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/coins')
def get_coins():
    return jsonify(SentimentAPI.POPULAR_COINS)

@app.route('/api/coin/<coin_id>')
def get_coin_data(coin_id):
    try:
        # Fetch from CoinGecko API
        response = requests.get(
            f"https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids={coin_id}&order=market_cap_desc&per_page=1&page=1&sparkline=false"
        )
        data = response.json()
        
        if data and len(data) > 0:
            return jsonify(data[0])
        else:
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

@app.route('/api/alerts', methods=['GET'])
def get_alerts():
    alerts = Alert.query.all()
    return jsonify([{
        'id': alert.id,
        'coinId': alert.coin_id,
        'coinName': alert.coin_name,
        'type': alert.alert_type,
        'condition': alert.condition,
        'threshold': alert.threshold,
        'enabled': alert.enabled,
        'createdAt': alert.created_at.isoformat()
    } for alert in alerts])

@app.route('/api/alerts', methods=['POST'])
def create_alert():
    data = request.json
    
    alert = Alert(
        coin_id=data['coinId'],
        coin_name=data['coinName'],
        alert_type=data['type'],
        condition=data['condition'],
        threshold=data['threshold'],
        enabled=data.get('enabled', True)
    )
    
    db.session.add(alert)
    db.session.commit()
    
    return jsonify({
        'id': alert.id,
        'coinId': alert.coin_id,
        'coinName': alert.coin_name,
        'type': alert.alert_type,
        'condition': alert.condition,
        'threshold': alert.threshold,
        'enabled': alert.enabled,
        'createdAt': alert.created_at.isoformat()
    }), 201

@app.route('/api/alerts/<int:alert_id>', methods=['PUT'])
def update_alert(alert_id):
    alert = Alert.query.get_or_404(alert_id)
    data = request.json
    
    alert.enabled = data.get('enabled', alert.enabled)
    db.session.commit()
    
    return jsonify({
        'id': alert.id,
        'coinId': alert.coin_id,
        'coinName': alert.coin_name,
        'type': alert.alert_type,
        'condition': alert.condition,
        'threshold': alert.threshold,
        'enabled': alert.enabled,
        'createdAt': alert.created_at.isoformat()
    })

@app.route('/api/alerts/<int:alert_id>', methods=['DELETE'])
def delete_alert(alert_id):
    alert = Alert.query.get_or_404(alert_id)
    db.session.delete(alert)
    db.session.commit()
    
    return '', 204

@app.route('/api/export/<coin_id>')
def export_sentiment_data(coin_id):
    time_range = request.args.get('timeRange', '1d')
    format_type = request.args.get('format', 'csv')
    current_price = request.args.get('currentPrice', type=float)
    price_change_24h = request.args.get('priceChange24h', type=float)
    
    # Get coin info
    coin_info = next((coin for coin in SentimentAPI.POPULAR_COINS if coin['id'] == coin_id), None)
    if not coin_info:
        return jsonify({"error": "Coin not found"}), 404
    
    # Generate sentiment data
    data = SentimentAPI.generate_realistic_sentiment(coin_id, time_range, current_price, price_change_24h)
    
    if format_type == 'csv':
        return export_csv(data, coin_id, coin_info['name'], time_range)
    elif format_type == 'json':
        return export_json(data, coin_id, coin_info['name'], time_range, current_price)
    elif format_type == 'ml-ready':
        return export_ml_ready(data, coin_id, coin_info['name'], time_range, current_price)
    else:
        return jsonify({"error": "Invalid format"}), 400

def export_csv(data, coin_id, coin_name, time_range):
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write headers
    headers = [
        'timestamp', 'positive_sentiment', 'negative_sentiment', 'neutral_sentiment',
        'overall_score', 'confidence', 'volume_correlation', 'social_mentions',
        'news_sentiment', 'fear_greed_index', 'market_cap_influence',
        'trading_volume_24h', 'price_momentum', 'volatility_index',
        'rsi', 'macd', 'bollinger_position', 'volume_sma_ratio',
        'btc_dominance', 'market_phase', 'correlation_with_btc', 'sector_sentiment',
        'twitter_sentiment', 'reddit_sentiment', 'telegram_sentiment',
        'news_source_sentiment', 'trading_signals_sentiment',
        'coin_id', 'coin_name', 'time_range', 'export_timestamp'
    ]
    writer.writerow(headers)
    
    # Write data
    for point in data:
        row = [
            point['timestamp'], point['positive'], point['negative'], point['neutral'],
            point['overall'], point['confidence'], point['volume_correlation'],
            point['social_mentions'], point['news_sentiment'], point['fear_greed_index'],
            point['market_cap_influence'], point['trading_volume_24h'],
            point['price_momentum'], point['volatility_index'],
            point['technical_indicators']['rsi'], point['technical_indicators']['macd'],
            point['technical_indicators']['bollinger_position'],
            point['technical_indicators']['volume_sma_ratio'],
            point['market_context']['btc_dominance'], point['market_context']['market_phase'],
            point['market_context']['correlation_with_btc'],
            point['market_context']['sector_sentiment'],
            point['sources']['twitter'], point['sources']['reddit'],
            point['sources']['telegram'], point['sources']['news'],
            point['sources']['trading_signals'],
            coin_id, coin_name, time_range, datetime.utcnow().isoformat()
        ]
        writer.writerow(row)
    
    output.seek(0)
    
    # Create response
    response = send_file(
        io.BytesIO(output.getvalue().encode()),
        mimetype='text/csv',
        as_attachment=True,
        download_name=f'{coin_id}_sentiment_{time_range}_{datetime.now().strftime("%Y%m%d")}.csv'
    )
    
    return response

def export_json(data, coin_id, coin_name, time_range, current_price):
    export_data = {
        "metadata": {
            "coin_id": coin_id,
            "coin_name": coin_name,
            "time_range": time_range,
            "current_price": current_price,
            "export_timestamp": datetime.utcnow().isoformat(),
            "data_points": len(data)
        },
        "sentiment_data": data
    }
    
    response = send_file(
        io.BytesIO(json.dumps(export_data, indent=2).encode()),
        mimetype='application/json',
        as_attachment=True,
        download_name=f'{coin_id}_sentiment_{time_range}_{datetime.now().strftime("%Y%m%d")}.json'
    )
    
    return response

def export_ml_ready(data, coin_id, coin_name, time_range, current_price):
    # Generate ML-ready dataset
    features = []
    for point in data:
        feature_vector = [
            point['positive'], point['negative'], point['neutral'],
            point['confidence'], point['volume_correlation'],
            point['social_mentions'] / 1000,  # Normalized
            point['news_sentiment'], point['fear_greed_index'],
            point['market_cap_influence'], point['trading_volume_24h'] / 1000000,  # Normalized
            point['price_momentum'], point['volatility_index'],
            point['technical_indicators']['rsi'], point['technical_indicators']['macd'],
            point['technical_indicators']['bollinger_position'],
            point['technical_indicators']['volume_sma_ratio'],
            point['market_context']['btc_dominance'],
            1 if point['market_context']['market_phase'] == 'bull' else -1 if point['market_context']['market_phase'] == 'bear' else 0,
            point['market_context']['correlation_with_btc'],
            point['market_context']['sector_sentiment'],
            point['sources']['twitter'], point['sources']['reddit'],
            point['sources']['telegram'], point['sources']['news'],
            point['sources']['trading_signals']
        ]
        
        labels = {
            "sentiment_direction": 1 if point['overall'] > 5 else -1 if point['overall'] < -5 else 0,
            "sentiment_strength": abs(point['overall']),
            "market_phase": point['market_context']['market_phase'],
            "high_confidence": 1 if point['confidence'] > 0.8 else 0
        }
        
        features.append({
            "features": feature_vector,
            "labels": labels,
            "timestamp": point['timestamp'],
            "raw_overall_score": point['overall']
        })
    
    ml_dataset = {
        "dataset_info": {
            "name": f"{coin_name}_sentiment_dataset",
            "coin_id": coin_id,
            "time_range": time_range,
            "samples": len(features),
            "feature_count": len(features[0]["features"]) if features else 0,
            "created_at": datetime.utcnow().isoformat(),
            "description": "Cryptocurrency sentiment analysis dataset ready for ML training"
        },
        "feature_names": [
            "positive_sentiment", "negative_sentiment", "neutral_sentiment",
            "confidence", "volume_correlation", "social_mentions_normalized",
            "news_sentiment", "fear_greed_index", "market_cap_influence",
            "trading_volume_normalized", "price_momentum", "volatility_index",
            "rsi", "macd", "bollinger_position", "volume_sma_ratio",
            "btc_dominance", "market_phase_encoded", "correlation_with_btc",
            "sector_sentiment", "twitter_sentiment", "reddit_sentiment",
            "telegram_sentiment", "news_source_sentiment", "trading_signals_sentiment"
        ],
        "label_descriptions": {
            "sentiment_direction": "Sentiment direction: 1=bullish, 0=neutral, -1=bearish",
            "sentiment_strength": "Absolute sentiment strength (0-100)",
            "market_phase": "Market phase: bull/bear/sideways",
            "high_confidence": "High confidence prediction: 1=yes, 0=no"
        },
        "data": features
    }
    
    response = send_file(
        io.BytesIO(json.dumps(ml_dataset, indent=2).encode()),
        mimetype='application/json',
        as_attachment=True,
        download_name=f'{coin_id}_sentiment_{time_range}_ml_ready_{datetime.now().strftime("%Y%m%d")}.json'
    )
    
    return response

# Initialize database
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)