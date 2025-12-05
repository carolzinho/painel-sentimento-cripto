"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart, Line, XAxis, YAxis } from "recharts"
import { TrendingUp, TrendingDown, Activity } from "lucide-react"
import { AlertManager, type Alert } from "../components/alert-manager"
import { NotificationSystem } from "../components/notification-system"
import { NotificationPermission } from "../components/notification-permission"
import { Toaster } from "@/components/ui/toaster"
import { TimeRangeSelector } from "../components/time-range-selector"
import { ExportManager } from "../components/export-manager"
import { sentimentAPI, type EnhancedSentimentData, type TimeRange } from "../lib/sentiment-api"

interface CoinData {
  id: string
  name: string
  symbol: string
  current_price: number
  price_change_percentage_24h: number
}

interface SentimentData {
  timestamp: string
  positive: number
  negative: number
  neutral: number
  overall: number
}

const POPULAR_COINS = [
  { id: "bitcoin", name: "Bitcoin", symbol: "BTC" },
  { id: "ethereum", name: "Ethereum", symbol: "ETH" },
  { id: "binancecoin", name: "BNB", symbol: "BNB" },
  { id: "solana", name: "Solana", symbol: "SOL" },
  { id: "cardano", name: "Cardano", symbol: "ADA" },
]

// gerar dados mock (alterar depois)
const generateSentimentData = (coinId: string): SentimentData[] => {
  const data: SentimentData[] = []
  const now = new Date()

  for (let i = 23; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000)

    // padroes de sentimento
    let basePositive = 45
    let baseNegative = 35

    if (coinId === "bitcoin") {
      basePositive = 55
      baseNegative = 25
    } else if (coinId === "ethereum") {
      basePositive = 50
      baseNegative = 30
    }

    // adicionar aleatoriedade e trend
    const variation = Math.sin(i * 0.3) * 10 + Math.random() * 10 - 5
    const positive = Math.max(20, Math.min(70, basePositive + variation))
    const negative = Math.max(15, Math.min(50, baseNegative - variation * 0.5))
    const neutral = 100 - positive - negative
    const overall = positive - negative

    data.push({
      timestamp: timestamp.toISOString(),
      positive: Math.round(positive),
      negative: Math.round(negative),
      neutral: Math.round(neutral),
      overall: Math.round(overall),
    })
  }

  return data
}

export default function CryptoSentimentDashboard() {
  const [selectedCoin, setSelectedCoin] = useState("bitcoin")
  const [coinData, setCoinData] = useState<CoinData | null>(null)
  const [loading, setLoading] = useState(true)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [previousSentiment, setPreviousSentiment] = useState<SentimentData | null>(null)
  const [timeRange, setTimeRange] = useState<TimeRange>("1d")
  const [sentimentData, setSentimentData] = useState<EnhancedSentimentData[]>([])

  // fetch coin da coingecko 
  useEffect(() => {
    const fetchCoinData = async () => {
      try {
        setLoading(true)
        const response = await fetch(
          `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${selectedCoin}&order=market_cap_desc&per_page=1&page=1&sparkline=false`,
        )
        const coinGeckoData = await response.json()

        if (coinGeckoData && coinGeckoData.length > 0) {
          setCoinData(coinGeckoData[0])
        }

        // Generate sentiment data for the selected coin
        const sentimentDataResponse = await sentimentAPI.fetchSentimentData(
          selectedCoin,
          timeRange,
          coinData?.current_price,
          coinData?.price_change_percentage_24h,
        )
        setSentimentData(sentimentDataResponse)
      } catch (error) {
        console.error("Error fetching coin data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCoinData()
  }, [selectedCoin, timeRange])

  // alertas localstorage
  useEffect(() => {
    const savedAlerts = localStorage.getItem("crypto-sentiment-alerts")
    if (savedAlerts) {
      try {
        setAlerts(JSON.parse(savedAlerts))
      } catch (error) {
        console.error("Error loading alerts:", error)
      }
    }
  }, [])

  // salvar alertas 
  useEffect(() => {
    localStorage.setItem("crypto-sentiment-alerts", JSON.stringify(alerts))
  }, [alerts])

  // track sentimentos previos para alerta de mudança
  useEffect(() => {
    if (sentimentData.length > 1) {
      setPreviousSentiment(sentimentData[sentimentData.length - 2])
    }
  }, [sentimentData])

  const currentSentiment = sentimentData[sentimentData.length - 1]
  const selectedCoinInfo = POPULAR_COINS.find((coin) => coin.id === selectedCoin)

  const chartConfig = {
    overall: {
      label: "Overall Sentiment",
      color: "hsl(var(--chart-1))",
    },
    positive: {
      label: "Positive",
      color: "hsl(var(--chart-2))",
    },
    negative: {
      label: "Negative",
      color: "hsl(var(--chart-3))",
    },
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Crypto Sentiment Dashboard</h1>
            <p className="text-muted-foreground">Real-time sentiment analysis for cryptocurrency markets</p>
          </div>

          <div className="flex items-center gap-4">
            <TimeRangeSelector selectedRange={timeRange} onRangeChange={setTimeRange} />
            <Select value={selectedCoin} onValueChange={setSelectedCoin}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select a coin" />
              </SelectTrigger>
              <SelectContent>
                {POPULAR_COINS.map((coin) => (
                  <SelectItem key={coin.id} value={coin.id}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{coin.symbol}</span>
                      <span className="text-muted-foreground">{coin.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* prompt notificaçao */}
        <NotificationPermission />

        {/* preço */}
        {coinData && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <h3 className="text-2xl font-bold">{selectedCoinInfo?.name}</h3>
                    <p className="text-muted-foreground">{selectedCoinInfo?.symbol}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">${coinData.current_price.toLocaleString()}</p>
                    <div className="flex items-center gap-1">
                      {coinData.price_change_percentage_24h > 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      )}
                      <span
                        className={`text-sm font-medium ${
                          coinData.price_change_percentage_24h > 0 ? "text-green-500" : "text-red-500"
                        }`}
                      >
                        {coinData.price_change_percentage_24h.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* cards sentimento */}
        {currentSentiment && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Positive Sentiment</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">{currentSentiment.positive}%</div>
                <p className="text-xs text-muted-foreground">Bullish market sentiment</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Negative Sentiment</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">{currentSentiment.negative}%</div>
                <p className="text-xs text-muted-foreground">Bearish market sentiment</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Neutral Sentiment</CardTitle>
                <Activity className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-500">{currentSentiment.neutral}%</div>
                <p className="text-xs text-muted-foreground">Sideways market sentiment</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overall Score</CardTitle>
                <Badge variant={currentSentiment.overall > 0 ? "default" : "destructive"}>
                  {currentSentiment.overall > 0 ? "Bullish" : "Bearish"}
                </Badge>
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${currentSentiment.overall > 0 ? "text-green-500" : "text-red-500"}`}
                >
                  {currentSentiment.overall > 0 ? "+" : ""}
                  {currentSentiment.overall}
                </div>
                <p className="text-xs text-muted-foreground">Net sentiment score</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* chart sentimento */}
        <Card>
          <CardHeader>
            <CardTitle>Sentiment Over Time (24h)</CardTitle>
            <CardDescription>
              Track sentiment changes for {selectedCoinInfo?.name} over the last 24 hours
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[400px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <ChartContainer config={chartConfig} className="h-[400px]">
                <LineChart data={sentimentData}>
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(value) => {
                      const date = new Date(value)
                      return date.toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    }}
                    interval="preserveStartEnd"
                  />
                  <YAxis domain={[-50, 70]} />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    labelFormatter={(value) => {
                      const date = new Date(value)
                      return date.toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="positive"
                    stroke="var(--color-positive)"
                    strokeWidth={2}
                    dot={false}
                    name="Positive %"
                  />
                  <Line
                    type="monotone"
                    dataKey="negative"
                    stroke="var(--color-negative)"
                    strokeWidth={2}
                    dot={false}
                    name="Negative %"
                  />
                  <Line
                    type="monotone"
                    dataKey="overall"
                    stroke="var(--color-overall)"
                    strokeWidth={3}
                    dot={false}
                    name="Overall Score"
                  />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* info */}
        <Card>
          <CardHeader>
            <CardTitle>About Sentiment Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-green-500">Positive Sentiment</h4>
                <p className="text-sm text-muted-foreground">
                  Indicates bullish market sentiment based on social media mentions, news sentiment, and trading
                  activity.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-red-500">Negative Sentiment</h4>
                <p className="text-sm text-muted-foreground">
                  Reflects bearish market sentiment from negative news, social media discussions, and market fear.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-blue-500">Overall Score</h4>
                <p className="text-sm text-muted-foreground">
                  Net sentiment calculated as positive minus negative sentiment, providing a single market mood
                  indicator.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* gerenciador de alertas */}
        <Card>
          <CardContent className="p-6">
            <AlertManager
              selectedCoin={selectedCoin}
              selectedCoinName={selectedCoinInfo?.name || ""}
              alerts={alerts}
              onAlertsChange={setAlerts}
            />
          </CardContent>
        </Card>

        {/* sistema de notificação */}
        <NotificationSystem
          alerts={alerts}
          currentSentiment={currentSentiment}
          previousSentiment={previousSentiment}
          coinName={selectedCoinInfo?.name || ""}
        />

        {/* notificações toast */}
        <Toaster />

        {/* gerenciador de export */}
        <ExportManager
          sentimentData={sentimentData}
          coinId={selectedCoin}
          coinName={selectedCoinInfo?.name || ""}
          timeRange={timeRange}
          currentPrice={coinData?.current_price}
        />
      </div>
    </div>
  )
}
