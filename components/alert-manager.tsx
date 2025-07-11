"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bell, Plus, Trash2 } from "lucide-react"

export interface Alert {
  id: string
  coinId: string
  coinName: string
  type: "positive" | "negative" | "overall"
  condition: "above" | "below"
  threshold: number
  enabled: boolean
  createdAt: string
}

interface AlertManagerProps {
  selectedCoin: string
  selectedCoinName: string
  alerts: Alert[]
  onAlertsChange: (alerts: Alert[]) => void
}

export function AlertManager({ selectedCoin, selectedCoinName, alerts, onAlertsChange }: AlertManagerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [newAlert, setNewAlert] = useState({
    type: "positive" as const,
    condition: "above" as const,
    threshold: 60,
  })

  const createAlert = () => {
    const alert: Alert = {
      id: Date.now().toString(),
      coinId: selectedCoin,
      coinName: selectedCoinName,
      type: newAlert.type,
      condition: newAlert.condition,
      threshold: newAlert.threshold,
      enabled: true,
      createdAt: new Date().toISOString(),
    }

    onAlertsChange([...alerts, alert])
    setIsOpen(false)
    setNewAlert({
      type: "positive",
      condition: "above",
      threshold: 60,
    })
  }

  const deleteAlert = (alertId: string) => {
    onAlertsChange(alerts.filter((alert) => alert.id !== alertId))
  }

  const toggleAlert = (alertId: string) => {
    onAlertsChange(alerts.map((alert) => (alert.id === alertId ? { ...alert, enabled: !alert.enabled } : alert)))
  }

  const currentCoinAlerts = alerts.filter((alert) => alert.coinId === selectedCoin)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Sentiment Alerts</h3>
          <Badge variant="secondary">{currentCoinAlerts.length}</Badge>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Alert
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Sentiment Alert</DialogTitle>
              <DialogDescription>
                Get notified when {selectedCoinName} sentiment crosses your threshold
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="alert-type">Sentiment Type</Label>
                <Select
                  value={newAlert.type}
                  onValueChange={(value: "positive" | "negative" | "overall") =>
                    setNewAlert({ ...newAlert, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="positive">Positive Sentiment</SelectItem>
                    <SelectItem value="negative">Negative Sentiment</SelectItem>
                    <SelectItem value="overall">Overall Score</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="alert-condition">Condition</Label>
                <Select
                  value={newAlert.condition}
                  onValueChange={(value: "above" | "below") => setNewAlert({ ...newAlert, condition: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="above">Goes Above</SelectItem>
                    <SelectItem value="below">Goes Below</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="alert-threshold">Threshold {newAlert.type === "overall" ? "(Score)" : "(%)"}</Label>
                <Input
                  id="alert-threshold"
                  type="number"
                  value={newAlert.threshold}
                  onChange={(e) => setNewAlert({ ...newAlert, threshold: Number.parseInt(e.target.value) || 0 })}
                  min={newAlert.type === "overall" ? -50 : 0}
                  max={newAlert.type === "overall" ? 70 : 100}
                />
              </div>

              <Button onClick={createAlert} className="w-full">
                Create Alert
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {currentCoinAlerts.length === 0 ? (
          <Card>
            <CardContent className="p-4 text-center text-muted-foreground">
              No alerts set for {selectedCoinName}. Create your first alert to get notified of sentiment changes.
            </CardContent>
          </Card>
        ) : (
          currentCoinAlerts.map((alert) => (
            <Card key={alert.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Switch checked={alert.enabled} onCheckedChange={() => toggleAlert(alert.id)} />
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            alert.type === "positive"
                              ? "default"
                              : alert.type === "negative"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {alert.type}
                        </Badge>
                        <span className="text-sm font-medium">
                          {alert.condition} {alert.threshold}
                          {alert.type === "overall" ? "" : "%"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Alert when {alert.type} sentiment goes {alert.condition} {alert.threshold}
                        {alert.type === "overall" ? " points" : "%"}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => deleteAlert(alert.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
