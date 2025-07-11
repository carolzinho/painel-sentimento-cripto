"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Database } from "lucide-react"
import type { EnhancedSentimentData, TimeRange } from "../lib/sentiment-api"

interface ExportManagerProps {
  sentimentData: EnhancedSentimentData[]
  coinId: string
  coinName: string
  timeRange: TimeRange
  currentPrice?: number
}

interface ExportOptions {
  includeRawSentiment: boolean
  includeTechnicalIndicators: boolean
  includeMarketContext: boolean
  includeSources: boolean
  includeMetadata: boolean
  format: "csv" | "json" | "ml-ready"
}

export function ExportManager({ sentimentData, coinId, coinName, timeRange, currentPrice }: ExportManagerProps) {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    includeRawSentiment: true,
    includeTechnicalIndicators: true,
    includeMarketContext: true,
    includeSources: true,
    includeMetadata: true,
    format: "ml-ready",
  })

  const updateOption = (key: keyof ExportOptions, value: boolean | string) => {
    setExportOptions((prev) => ({ ...prev, [key]: value }))
  }

  const generateCSV = (data: EnhancedSentimentData[], options: ExportOptions): string => {
    const headers: string[] = []

    // Basic sentiment data
    if (options.includeRawSentiment) {
      headers.push(
        "timestamp",
        "positive_sentiment",
        "negative_sentiment",
        "neutral_sentiment",
        "overall_score",
        "confidence",
        "volume_correlation",
        "social_mentions",
        "news_sentiment",
        "fear_greed_index",
        "market_cap_influence",
        "trading_volume_24h",
        "price_momentum",
        "volatility_index",
      )
    }

    // Technical indicators
    if (options.includeTechnicalIndicators) {
      headers.push("rsi", "macd", "bollinger_position", "volume_sma_ratio")
    }

    // Market context
    if (options.includeMarketContext) {
      headers.push("btc_dominance", "market_phase", "correlation_with_btc", "sector_sentiment")
    }

    // Sources breakdown
    if (options.includeSources) {
      headers.push(
        "twitter_sentiment",
        "reddit_sentiment",
        "telegram_sentiment",
        "news_source_sentiment",
        "trading_signals_sentiment",
      )
    }

    // Metadata
    if (options.includeMetadata) {
      headers.push("coin_id", "coin_name", "time_range", "current_price", "export_timestamp")
    }

    const rows = data.map((point) => {
      const row: (string | number)[] = []

      if (options.includeRawSentiment) {
        row.push(
          point.timestamp,
          point.positive,
          point.negative,
          point.neutral,
          point.overall,
          point.confidence,
          point.volume_correlation,
          point.social_mentions,
          point.news_sentiment,
          point.fear_greed_index,
          point.market_cap_influence,
          point.trading_volume_24h,
          point.price_momentum,
          point.volatility_index,
        )
      }

      if (options.includeTechnicalIndicators) {
        row.push(
          point.technical_indicators.rsi,
          point.technical_indicators.macd,
          point.technical_indicators.bollinger_position,
          point.technical_indicators.volume_sma_ratio,
        )
      }

      if (options.includeMarketContext) {
        row.push(
          point.market_context.btc_dominance,
          point.market_context.market_phase,
          point.market_context.correlation_with_btc,
          point.market_context.sector_sentiment,
        )
      }

      if (options.includeSources) {
        row.push(
          point.sources.twitter,
          point.sources.reddit,
          point.sources.telegram,
          point.sources.news,
          point.sources.trading_signals,
        )
      }

      if (options.includeMetadata) {
        row.push(coinId, coinName, timeRange, currentPrice || 0, new Date().toISOString())
      }

      return row
    })

    return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")
  }

  const generateJSON = (data: EnhancedSentimentData[], options: ExportOptions) => {
    const exportData = {
      metadata: options.includeMetadata
        ? {
            coin_id: coinId,
            coin_name: coinName,
            time_range: timeRange,
            current_price: currentPrice,
            export_timestamp: new Date().toISOString(),
            data_points: data.length,
            export_options: options,
          }
        : undefined,
      sentiment_data: data.map((point) => {
        const exportPoint: any = {}

        if (options.includeRawSentiment) {
          exportPoint.timestamp = point.timestamp
          exportPoint.sentiment = {
            positive: point.positive,
            negative: point.negative,
            neutral: point.neutral,
            overall: point.overall,
            confidence: point.confidence,
          }
          exportPoint.metrics = {
            volume_correlation: point.volume_correlation,
            social_mentions: point.social_mentions,
            news_sentiment: point.news_sentiment,
            fear_greed_index: point.fear_greed_index,
            market_cap_influence: point.market_cap_influence,
            trading_volume_24h: point.trading_volume_24h,
            price_momentum: point.price_momentum,
            volatility_index: point.volatility_index,
          }
        }

        if (options.includeTechnicalIndicators) {
          exportPoint.technical_indicators = point.technical_indicators
        }

        if (options.includeMarketContext) {
          exportPoint.market_context = point.market_context
        }

        if (options.includeSources) {
          exportPoint.sources = point.sources
        }

        return exportPoint
      }),
    }

    return JSON.stringify(exportData, null, 2)
  }

  const generateMLReady = (data: EnhancedSentimentData[], options: ExportOptions) => {
    // Generate both training features and potential labels
    const features = data.map((point) => ({
      // Feature vector for ML training
      features: [
        point.positive,
        point.negative,
        point.neutral,
        point.confidence,
        point.volume_correlation,
        point.social_mentions / 1000, // Normalized
        point.news_sentiment,
        point.fear_greed_index,
        point.market_cap_influence,
        point.trading_volume_24h / 1000000, // Normalized
        point.price_momentum,
        point.volatility_index,
        ...(options.includeTechnicalIndicators
          ? [
              point.technical_indicators.rsi,
              point.technical_indicators.macd,
              point.technical_indicators.bollinger_position,
              point.technical_indicators.volume_sma_ratio,
            ]
          : []),
        ...(options.includeMarketContext
          ? [
              point.market_context.btc_dominance,
              point.market_context.market_phase === "bull" ? 1 : point.market_context.market_phase === "bear" ? -1 : 0,
              point.market_context.correlation_with_btc,
              point.market_context.sector_sentiment,
            ]
          : []),
        ...(options.includeSources
          ? [
              point.sources.twitter,
              point.sources.reddit,
              point.sources.telegram,
              point.sources.news,
              point.sources.trading_signals,
            ]
          : []),
      ],
      // Potential labels for supervised learning
      labels: {
        sentiment_direction: point.overall > 5 ? 1 : point.overall < -5 ? -1 : 0,
        sentiment_strength: Math.abs(point.overall),
        market_phase: point.market_context.market_phase,
        high_confidence: point.confidence > 0.8 ? 1 : 0,
      },
      timestamp: point.timestamp,
      raw_overall_score: point.overall,
    }))

    return {
      dataset_info: {
        name: `${coinName}_sentiment_dataset`,
        coin_id: coinId,
        time_range: timeRange,
        samples: features.length,
        feature_count: features[0].features.length,
        created_at: new Date().toISOString(),
        description: "Cryptocurrency sentiment analysis dataset ready for ML training",
      },
      feature_names: [
        "positive_sentiment",
        "negative_sentiment",
        "neutral_sentiment",
        "confidence",
        "volume_correlation",
        "social_mentions_normalized",
        "news_sentiment",
        "fear_greed_index",
        "market_cap_influence",
        "trading_volume_normalized",
        "price_momentum",
        "volatility_index",
        ...(options.includeTechnicalIndicators ? ["rsi", "macd", "bollinger_position", "volume_sma_ratio"] : []),
        ...(options.includeMarketContext
          ? ["btc_dominance", "market_phase_encoded", "correlation_with_btc", "sector_sentiment"]
          : []),
        ...(options.includeSources
          ? [
              "twitter_sentiment",
              "reddit_sentiment",
              "telegram_sentiment",
              "news_source_sentiment",
              "trading_signals_sentiment",
            ]
          : []),
      ],
      label_descriptions: {
        sentiment_direction: "Sentiment direction: 1=bullish, 0=neutral, -1=bearish",
        sentiment_strength: "Absolute sentiment strength (0-100)",
        market_phase: "Market phase: bull/bear/sideways",
        high_confidence: "High confidence prediction: 1=yes, 0=no",
      },
      data: features,
    }
  }

  const downloadFile = (content: string, filename: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleExport = () => {
    const timestamp = new Date().toISOString().split("T")[0]
    const baseFilename = `${coinId}_sentiment_${timeRange}_${timestamp}`

    let content: string
    let filename: string
    let contentType: string

    switch (exportOptions.format) {
      case "csv":
        content = generateCSV(sentimentData, exportOptions)
        filename = `${baseFilename}.csv`
        contentType = "text/csv"
        break
      case "json":
        content = generateJSON(sentimentData, exportOptions)
        filename = `${baseFilename}.json`
        contentType = "application/json"
        break
      case "ml-ready":
        content = JSON.stringify(generateMLReady(sentimentData, exportOptions), null, 2)
        filename = `${baseFilename}_ml_ready.json`
        contentType = "application/json"
        break
    }

    downloadFile(content, filename, contentType)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Export Sentiment Data
        </CardTitle>
        <CardDescription>
          Export comprehensive sentiment data optimized for machine learning training and analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Export Format</Label>
              <Select
                value={exportOptions.format}
                onValueChange={(value: "csv" | "json" | "ml-ready") => updateOption("format", value)}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV (Spreadsheet)</SelectItem>
                  <SelectItem value="json">JSON (Structured)</SelectItem>
                  <SelectItem value="ml-ready">ML-Ready Dataset</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Data Components</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="raw-sentiment"
                    checked={exportOptions.includeRawSentiment}
                    onCheckedChange={(checked) => updateOption("includeRawSentiment", !!checked)}
                  />
                  <Label htmlFor="raw-sentiment" className="text-sm">
                    Raw Sentiment Data
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="technical-indicators"
                    checked={exportOptions.includeTechnicalIndicators}
                    onCheckedChange={(checked) => updateOption("includeTechnicalIndicators", !!checked)}
                  />
                  <Label htmlFor="technical-indicators" className="text-sm">
                    Technical Indicators
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="market-context"
                    checked={exportOptions.includeMarketContext}
                    onCheckedChange={(checked) => updateOption("includeMarketContext", !!checked)}
                  />
                  <Label htmlFor="market-context" className="text-sm">
                    Market Context
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sources"
                    checked={exportOptions.includeSources}
                    onCheckedChange={(checked) => updateOption("includeSources", !!checked)}
                  />
                  <Label htmlFor="sources" className="text-sm">
                    Sentiment Sources
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="metadata"
                    checked={exportOptions.includeMetadata}
                    onCheckedChange={(checked) => updateOption("includeMetadata", !!checked)}
                  />
                  <Label htmlFor="metadata" className="text-sm">
                    Metadata & Context
                  </Label>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Export Preview</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  • Dataset: {coinName} ({timeRange})
                </p>
                <p>• Data points: {sentimentData.length}</p>
                <p>• Format: {exportOptions.format.toUpperCase()}</p>
                <p>• Features: {exportOptions.format === "ml-ready" ? "Normalized for ML" : "Raw values"}</p>
              </div>
            </div>

            {exportOptions.format === "ml-ready" && (
              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="h-4 w-4 text-blue-600" />
                  <h4 className="font-medium text-blue-900 dark:text-blue-100">ML Training Ready</h4>
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Includes normalized features, encoded categorical variables, and multiple label options for supervised
                  learning.
                </p>
              </div>
            )}
          </div>
        </div>

        <Button onClick={handleExport} className="w-full" size="lg">
          <Download className="h-4 w-4 mr-2" />
          Export {coinName} Sentiment Data
        </Button>
      </CardContent>
    </Card>
  )
}
