"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell } from "lucide-react"

export function NotificationPermission() {
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission)
      setShowPrompt(Notification.permission === "default")
    }
  }, [])

  const requestPermission = async () => {
    if ("Notification" in window) {
      const result = await Notification.requestPermission()
      setPermission(result)
      setShowPrompt(false)
    }
  }

  if (!showPrompt || permission !== "default") {
    return null
  }

  return (
    <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-sm">Enable Browser Notifications</CardTitle>
        </div>
        <CardDescription>
          Get instant notifications when your sentiment alerts are triggered, even when the dashboard is closed.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex gap-2">
          <Button onClick={requestPermission} size="sm">
            Enable Notifications
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowPrompt(false)}>
            Maybe Later
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
