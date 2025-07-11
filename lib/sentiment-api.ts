"use client"

export interface SentimentDataPoint {
  timestamp: string
  positive: number
  negative: number
  neutral: number
  overall: number
  confidence: number
  volume_correlation: number
  social_mentions: number
  news_sentiment: number
  fear_greed_index: number
  market_cap_influence: number
  trading_volume_24h: number
  price_momentum: number
  volatility_index: number
}

export interface SentimentSource {
  twitter: number
  reddit: number
  telegram: number
  news: number
  trading_signals: number
}

export interface EnhancedSentimentData extends SentimentDataPoint {
  sources: SentimentSource
  technical_indicators: {
    rsi: number
    macd: number
    bollinger_position: number
    volume_sma_ratio: number
  }
  market_context: {
    btc_dominance: number
    market_phase: "bull" | "bear" | "sideways"
    correlation_with_btc: number
    sector_sentiment: number
  }
}

export type TimeRange = "1h" | "6h" | "1d" | "1w"

class SentimentAPI {
  private baseUrl = "https://api.crypto-sentiment.dev" // Mock API base

  // Generate realistic sentiment data with multiple factors
  generateRealisticSentiment(
    coinId: string,
    timeRange: TimeRange,
    currentPrice?: number,
    priceChange24h?: number,
  ): EnhancedSentimentData[] {
    const intervals = this.getIntervals(timeRange)
    const data: EnhancedSentimentData[] = []
    const now = new Date()

    // Base sentiment profiles for different coins
    const coinProfiles = {
      bitcoin: { basePositive: 55, baseNegative: 25, volatility: 0.8 },
      ethereum: { basePositive: 50, baseNegative: 30, volatility: 1.0 },
      binancecoin: { basePositive: 45, baseNegative: 35, volatility: 1.2 },
      solana: { basePositive: 48, baseNegative: 32, volatility: 1.5 },
      cardano: { basePositive: 42, baseNegative: 38, volatility: 1.1 },
    }

    const profile = coinProfiles[coinId as keyof typeof coinProfiles] || coinProfiles.bitcoin

    for (let i = intervals.count - 1; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * intervals.duration)

      // Create realistic market cycles and trends
      const timeProgress = i / intervals.count
      const marketCycle = Math.sin(timeProgress * Math.PI * 2) * 0.3
      const trendFactor = Math.cos(timeProgress * Math.PI * 4) * 0.2
      const randomNoise = (Math.random() - 0.5) * 0.4

      // Price correlation factor
      const priceCorrelation = priceChange24h ? Math.tanh(priceChange24h / 10) * 15 : 0

      // Calculate base sentiments with realistic factors
      const positive = Math.max(
        15,
        Math.min(
          75,
          profile.basePositive +
            marketCycle * 20 +
            trendFactor * 10 +
            randomNoise * profile.volatility * 15 +
            priceCorrelation,
        ),
      )

      const negative = Math.max(
        10,
        Math.min(
          60,
          profile.baseNegative -
            marketCycle * 15 -
            trendFactor * 8 +
            randomNoise * profile.volatility * 12 -
            priceCorrelation * 0.7,
        ),
      )

      const neutral = Math.max(10, 100 - positive - negative)
      const overall = positive - negative

      // Generate additional ML-ready features
      const confidence = Math.max(
        0.3,
        Math.min(1.0, 0.7 + (Math.abs(overall) / 50) * 0.3 + (Math.random() - 0.5) * 0.2),
      )

      const socialMentions = Math.max(
        100,
        Math.floor(1000 + Math.sin(timeProgress * Math.PI * 6) * 500 + Math.random() * 300),
      )

      const fearGreedIndex = Math.max(0, Math.min(100, 50 + overall * 0.8 + (Math.random() - 0.5) * 20))

      // Technical indicators
      const rsi = Math.max(0, Math.min(100, 50 + overall * 0.6 + (Math.random() - 0.5) * 30))

      const macd = (Math.random() - 0.5) * 2 + overall * 0.02

      // Market context
      const btcDominance = Math.max(
        40,
        Math.min(70, 55 + Math.sin(timeProgress * Math.PI * 3) * 8 + (Math.random() - 0.5) * 6),
      )

      const marketPhase: "bull" | "bear" | "sideways" = overall > 15 ? "bull" : overall < -15 ? "bear" : "sideways"

      data.push({
        timestamp: timestamp.toISOString(),
        positive: Math.round(positive * 10) / 10,
        negative: Math.round(negative * 10) / 10,
        neutral: Math.round(neutral * 10) / 10,
        overall: Math.round(overall * 10) / 10,
        confidence: Math.round(confidence * 1000) / 1000,
        volume_correlation: Math.round((0.3 + Math.abs(overall) / 100) * 1000) / 1000,
        social_mentions: socialMentions,
        news_sentiment: Math.round((overall * 0.8 + (Math.random() - 0.5) * 20) * 10) / 10,
        fear_greed_index: Math.round(fearGreedIndex * 10) / 10,
        market_cap_influence: Math.round((coinId === "bitcoin" ? 0.8 : 0.3 + Math.random() * 0.4) * 1000) / 1000,
        trading_volume_24h: Math.floor(1000000 + Math.random() * 5000000),
        price_momentum: Math.round((priceChange24h || (Math.random() - 0.5) * 10) * 100) / 100,
        volatility_index: Math.round((profile.volatility + Math.random() * 0.5) * 1000) / 1000,
        sources: {
          twitter: Math.round((positive * 0.4 + Math.random() * 20) * 10) / 10,
          reddit: Math.round((positive * 0.3 + Math.random() * 15) * 10) / 10,
          telegram: Math.round((positive * 0.2 + Math.random() * 10) * 10) / 10,
          news: Math.round((positive * 0.6 + Math.random() * 25) * 10) / 10,
          trading_signals: Math.round((overall + 50 + Math.random() * 20) * 10) / 10,
        },
        technical_indicators: {
          rsi: Math.round(rsi * 10) / 10,
          macd: Math.round(macd * 1000) / 1000,
          bollinger_position: Math.round((0.5 + overall / 100 + (Math.random() - 0.5) * 0.4) * 1000) / 1000,
          volume_sma_ratio: Math.round((1.0 + (Math.random() - 0.5) * 0.6) * 1000) / 1000,
        },
        market_context: {
          btc_dominance: Math.round(btcDominance * 10) / 10,
          market_phase: marketPhase,
          correlation_with_btc: Math.round((coinId === "bitcoin" ? 1.0 : 0.4 + Math.random() * 0.5) * 1000) / 1000,
          sector_sentiment: Math.round((overall + (Math.random() - 0.5) * 30) * 10) / 10,
        },
      })
    }

    return data
  }

  private getIntervals(timeRange: TimeRange) {
    switch (timeRange) {
      case "1h":
        return { count: 60, duration: 60 * 1000 } // 1 minute intervals
      case "6h":
        return { count: 72, duration: 5 * 60 * 1000 } // 5 minute intervals
      case "1d":
        return { count: 24, duration: 60 * 60 * 1000 } // 1 hour intervals
      case "1w":
        return { count: 168, duration: 60 * 60 * 1000 } // 1 hour intervals
      default:
        return { count: 24, duration: 60 * 60 * 1000 }
    }
  }

  // Simulate API call with realistic delay
  async fetchSentimentData(
    coinId: string,
    timeRange: TimeRange = "1d",
    currentPrice?: number,
    priceChange24h?: number,
  ): Promise<EnhancedSentimentData[]> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 300 + Math.random() * 700))

    return this.generateRealisticSentiment(coinId, timeRange, currentPrice, priceChange24h)
  }

  // Get current sentiment summary
  async getCurrentSentiment(coinId: string): Promise<EnhancedSentimentData> {
    const data = await this.fetchSentimentData(coinId, "1h")
    return data[data.length - 1]
  }

  // Get sentiment aggregated by source
  async getSentimentBySources(
    coinId: string,
    timeRange: TimeRange = "1d",
  ): Promise<
    {
      timestamp: string
      sources: SentimentSource
    }[]
  > {
    const data = await this.fetchSentimentData(coinId, timeRange)
    return data.map((point) => ({
      timestamp: point.timestamp,
      sources: point.sources,
    }))
  }
}

export const sentimentAPI = new SentimentAPI()
