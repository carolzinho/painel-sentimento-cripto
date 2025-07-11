"use client"

import { useEffect, useState } from "react"
import type { Alert } from "./alert-manager"
import { toast } from "@/hooks/use-toast"
import { AlertTriangle, TrendingUp, TrendingDown, Activity } from "lucide-react"

interface SentimentData {
  timestamp: string
  positive: number
  negative: number
  neutral: number
  overall: number
}

interface NotificationSystemProps {
  alerts: Alert[]
  currentSentiment: SentimentData | null
  previousSentiment: SentimentData | null
  coinName: string
}

interface TriggeredAlert {
  alert: Alert
  currentValue: number
  triggeredAt: string
}

export function NotificationSystem({ alerts, currentSentiment, previousSentiment, coinName }: NotificationSystemProps) {
  const [lastTriggeredAlerts, setLastTriggeredAlerts] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!currentSentiment || !previousSentiment) return

    const enabledAlerts = alerts.filter((alert) => alert.enabled)
    const triggeredAlerts: TriggeredAlert[] = []

    enabledAlerts.forEach((alert) => {
      const currentValue = getCurrentValue(currentSentiment, alert.type)
      const previousValue = getCurrentValue(previousSentiment, alert.type)

      const alertKey = `${alert.id}-${alert.threshold}-${alert.condition}`

      // Check if threshold was crossed
      const thresholdCrossed = checkThresholdCrossed(previousValue, currentValue, alert.threshold, alert.condition)

      if (thresholdCrossed && !lastTriggeredAlerts.has(alertKey)) {
        triggeredAlerts.push({
          alert,
          currentValue,
          triggeredAt: new Date().toISOString(),
        })

        // Add to triggered alerts to prevent duplicate notifications
        setLastTriggeredAlerts((prev) => new Set([...prev, alertKey]))

        // Remove from triggered alerts after 5 minutes to allow re-triggering
        setTimeout(
          () => {
            setLastTriggeredAlerts((prev) => {
              const newSet = new Set(prev)
              newSet.delete(alertKey)
              return newSet
            })
          },
          5 * 60 * 1000,
        )
      }
    })

    // Show notifications for triggered alerts
    triggeredAlerts.forEach(({ alert, currentValue }) => {
      showNotification(alert, currentValue, coinName)
    })
  }, [currentSentiment, previousSentiment, alerts, coinName, lastTriggeredAlerts])

  return null // This component only handles notifications
}

function getCurrentValue(sentiment: SentimentData, type: string): number {
  switch (type) {
    case "positive":
      return sentiment.positive
    case "negative":
      return sentiment.negative
    case "overall":
      return sentiment.overall
    default:
      return 0
  }
}

function checkThresholdCrossed(
  previousValue: number,
  currentValue: number,
  threshold: number,
  condition: "above" | "below",
): boolean {
  if (condition === "above") {
    return previousValue <= threshold && currentValue > threshold
  } else {
    return previousValue >= threshold && currentValue < threshold
  }
}

function showNotification(alert: Alert, currentValue: number, coinName: string) {
  const getIcon = () => {
    switch (alert.type) {
      case "positive":
        return TrendingUp
      case "negative":
        return TrendingDown
      case "overall":
        return Activity
      default:
        return AlertTriangle
    }
  }

  const getColor = () => {
    switch (alert.type) {
      case "positive":
        return "text-green-500"
      case "negative":
        return "text-red-500"
      case "overall":
        return currentValue > 0 ? "text-green-500" : "text-red-500"
      default:
        return "text-blue-500"
    }
  }

  const Icon = getIcon()
  const unit = alert.type === "overall" ? "" : "%"

  toast({
    title: `${coinName} Sentiment Alert`,
    description: (
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${getColor()}`} />
        <span>
          {alert.type.charAt(0).toUpperCase() + alert.type.slice(1)} sentiment is now{" "}
          <span className={`font-bold ${getColor()}`}>
            {currentValue}
            {unit}
          </span>{" "}
          ({alert.condition} {alert.threshold}
          {unit})
        </span>
      </div>
    ),
    duration: 8000,
  })

  // Browser notification if permission granted
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(`${coinName} Sentiment Alert`, {
      body: `${alert.type} sentiment is now ${currentValue}${unit} (${alert.condition} ${alert.threshold}${unit})`,
      icon: "/favicon.ico",
    })
  }
}
