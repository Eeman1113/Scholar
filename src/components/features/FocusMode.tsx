import { useState, useEffect } from 'react'
import { Play, Pause, RotateCcw, Settings, Volume2, VolumeX, Timer, Coffee, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useUiStore } from '@/store/uiStore'
import { motion, AnimatePresence } from 'framer-motion'

interface FocusModeProps {
  children: React.ReactNode
  className?: string
}

interface AmbientSound {
  id: string
  name: string
  icon: React.ReactNode
  url: string
  description: string
}

const ambientSounds: AmbientSound[] = [
  {
    id: 'none',
    name: 'None',
    icon: <VolumeX className="w-4 h-4" />,
    url: '',
    description: 'Silent mode'
  },
  {
    id: 'lofi',
    name: 'Lo-Fi',
    icon: <Volume2 className="w-4 h-4" />,
    url: 'https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1&loop=1&playlist=jfKfPfyJRdk',
    description: 'Lo-fi hip hop beats'
  },
  {
    id: 'rain',
    name: 'Rain',
    icon: <Volume2 className="w-4 h-4" />,
    url: 'https://mynoise.net/NoiseMachines/rainNoiseGenerator.php',
    description: 'Gentle rain sounds'
  },
  {
    id: 'whitenoise',
    name: 'White Noise',
    icon: <Volume2 className="w-4 h-4" />,
    url: 'https://mynoise.net/NoiseMachines/whiteNoiseGenerator.php',
    description: 'Pure white noise'
  },
  {
    id: 'nature',
    name: 'Nature',
    icon: <Volume2 className="w-4 h-4" />,
    url: 'https://mynoise.net/NoiseMachines/forestSoundsGenerator.php',
    description: 'Forest and nature sounds'
  }
]

export function FocusMode({ children, className = '' }: FocusModeProps) {
  const {
    focusMode,
    toggleFocusMode,
    setFocusType,
    startPomodoroSession,
    pausePomodoroSession,
    resetPomodoroSession,
    setPomodoroSettings,
    setAmbientSound,
    setSoundVolume,
    setFocusUiSettings
  } = useUiStore()

  const [timeRemaining, setTimeRemaining] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [tempSettings, setTempSettings] = useState({
    workDuration: focusMode.workDuration,
    breakDuration: focusMode.breakDuration,
    ambientSound: focusMode.ambientSound,
    soundVolume: focusMode.soundVolume,
    hideStatusBar: focusMode.hideStatusBar,
    hideToolbar: focusMode.hideToolbar,
    dimOpacity: focusMode.dimOpacity
  })

  // Timer logic
  useEffect(() => {
    if (!focusMode.isActive || !isTimerRunning || timeRemaining <= 0) return

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          setIsTimerRunning(false)
          // Auto-switch session type
          if (focusMode.currentSession === 'work') {
            setTimeRemaining(focusMode.breakDuration * 60)
          } else {
            setTimeRemaining(focusMode.workDuration * 60)
          }
          return prev
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [focusMode.isActive, isTimerRunning, timeRemaining, focusMode.workDuration, focusMode.breakDuration, focusMode.currentSession])

  // Initialize timer when focus mode starts
  useEffect(() => {
    if (focusMode.isActive && focusMode.pomodoroEnabled) {
      if (focusMode.sessionStartTime > 0) {
        const elapsed = Math.floor((Date.now() - focusMode.sessionStartTime) / 1000)
        const duration = focusMode.currentSession === 'work' ? focusMode.workDuration * 60 : focusMode.breakDuration * 60
        setTimeRemaining(Math.max(0, duration - elapsed))
        setIsTimerRunning(focusMode.currentSession !== 'inactive')
      } else {
        setTimeRemaining(focusMode.workDuration * 60)
        setIsTimerRunning(false)
      }
    }
  }, [focusMode.isActive, focusMode.pomodoroEnabled, focusMode.sessionStartTime, focusMode.currentSession, focusMode.workDuration, focusMode.breakDuration])

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleStartTimer = () => {
    if (!isTimerRunning) {
      startPomodoroSession()
      setIsTimerRunning(true)
    } else {
      pausePomodoroSession()
      setIsTimerRunning(false)
    }
  }

  const handleResetTimer = () => {
    resetPomodoroSession()
    setIsTimerRunning(false)
    setTimeRemaining(focusMode.workDuration * 60)
  }

  const applySettings = () => {
    setPomodoroSettings(tempSettings.workDuration, tempSettings.breakDuration)
    setAmbientSound(tempSettings.ambientSound as any)
    setSoundVolume(tempSettings.soundVolume)
    setFocusUiSettings({
      hideStatusBar: tempSettings.hideStatusBar,
      hideToolbar: tempSettings.hideToolbar,
      dimOpacity: tempSettings.dimOpacity
    })
    setShowSettings(false)
  }

  const resetSettings = () => {
    setTempSettings({
      workDuration: focusMode.workDuration,
      breakDuration: focusMode.breakDuration,
      ambientSound: focusMode.ambientSound,
      soundVolume: focusMode.soundVolume,
      hideStatusBar: focusMode.hideStatusBar,
      hideToolbar: focusMode.hideToolbar,
      dimOpacity: focusMode.dimOpacity
    })
  }

  if (!focusMode.isActive) {
    return <div className={className}>{children}</div>
  }

  return (
    <div className={`relative ${className}`}>
      {/* Dim Overlay */}
      <div 
        className="fixed inset-0 bg-black pointer-events-none transition-opacity duration-500 z-10"
        style={{ opacity: focusMode.dimOpacity }}
      />

      {/* Ambient Sound Player */}
      {focusMode.ambientSound !== 'none' && (
        <iframe
          src={ambientSounds.find(s => s.id === focusMode.ambientSound)?.url}
          className="absolute -top-full -left-full opacity-0 w-1 h-1"
          allow="autoplay"
        />
      )}

      {/* Main Content with Focus Styling */}
      <div className="relative z-20">
        {children}
      </div>

      {/* Focus Mode Controls */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-6 right-6 z-50"
        >
          <Card className="glass-card bg-background/95 backdrop-blur-xl shadow-2xl">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                {/* Focus Mode Indicator */}
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  <span className="text-sm font-medium">Focus Mode</span>
                </div>

                {/* Pomodoro Timer */}
                {focusMode.pomodoroEnabled && (
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      {focusMode.currentSession === 'work' ? (
                        <Zap className="w-4 h-4 text-orange-500" />
                      ) : focusMode.currentSession === 'break' ? (
                        <Coffee className="w-4 h-4 text-blue-500" />
                      ) : (
                        <Timer className="w-4 h-4 text-muted-foreground" />
                      )}
                      <span className={`text-lg font-mono font-bold ${
                        focusMode.currentSession === 'work' ? 'text-orange-500' :
                        focusMode.currentSession === 'break' ? 'text-blue-500' :
                        'text-muted-foreground'
                      }`}>
                        {formatTime(timeRemaining)}
                      </span>
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleStartTimer}
                      className="w-8 h-8 p-0"
                    >
                      {isTimerRunning ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleResetTimer}
                      className="w-8 h-8 p-0"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>

                    <Separator orientation="vertical" className="h-6" />
                  </div>
                )}

                {/* Session Count */}
                {focusMode.totalSessions > 0 && (
                  <Badge variant="secondary">
                    {focusMode.totalSessions} sessions
                  </Badge>
                )}

                {/* Controls */}
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowSettings(!showSettings)}
                    className="w-8 h-8 p-0"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={toggleFocusMode}
                  >
                    Exit Focus
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed bottom-24 right-6 z-50"
          >
            <Card className="w-80 glass-card bg-background/95 backdrop-blur-xl shadow-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Focus Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Focus Type */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Focus Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['paragraph', 'sentence', 'typewriter'] as const).map((type) => (
                      <Button
                        key={type}
                        variant={focusMode.type === type ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFocusType(type)}
                        className="text-xs"
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Pomodoro Settings */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Pomodoro Timer</label>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div>
                      <label className="text-xs text-muted-foreground">Work (min)</label>
                      <input
                        type="number"
                        value={tempSettings.workDuration}
                        onChange={(e) => setTempSettings(prev => ({ ...prev, workDuration: parseInt(e.target.value) || 25 }))}
                        className="w-full px-2 py-1 text-sm border rounded"
                        min="1"
                        max="120"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Break (min)</label>
                      <input
                        type="number"
                        value={tempSettings.breakDuration}
                        onChange={(e) => setTempSettings(prev => ({ ...prev, breakDuration: parseInt(e.target.value) || 5 }))}
                        className="w-full px-2 py-1 text-sm border rounded"
                        min="1"
                        max="60"
                      />
                    </div>
                  </div>
                </div>

                {/* Ambient Sound */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Ambient Sound</label>
                  <div className="grid grid-cols-2 gap-1">
                    {ambientSounds.map((sound) => (
                      <Button
                        key={sound.id}
                        variant={tempSettings.ambientSound === sound.id ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setTempSettings(prev => ({ ...prev, ambientSound: sound.id as any }))}
                        className="text-xs justify-start"
                      >
                        {sound.icon}
                        <span className="ml-1">{sound.name}</span>
                      </Button>
                    ))}
                  </div>
                  
                  {tempSettings.ambientSound !== 'none' && (
                    <div className="mt-2">
                      <label className="text-xs text-muted-foreground">Volume</label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={tempSettings.soundVolume}
                        onChange={(e) => setTempSettings(prev => ({ ...prev, soundVolume: parseInt(e.target.value) }))}
                        className="w-full"
                      />
                      <div className="text-xs text-muted-foreground text-center">{tempSettings.soundVolume}%</div>
                    </div>
                  )}
                </div>

                {/* UI Settings */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Interface</label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-sm">
                      <input
                        type="checkbox"
                        checked={tempSettings.hideStatusBar}
                        onChange={(e) => setTempSettings(prev => ({ ...prev, hideStatusBar: e.target.checked }))}
                      />
                      <span>Hide status bar</span>
                    </label>
                    <label className="flex items-center space-x-2 text-sm">
                      <input
                        type="checkbox"
                        checked={tempSettings.hideToolbar}
                        onChange={(e) => setTempSettings(prev => ({ ...prev, hideToolbar: e.target.checked }))}
                      />
                      <span>Hide toolbar</span>
                    </label>
                    <div>
                      <label className="text-xs text-muted-foreground">Dim opacity</label>
                      <input
                        type="range"
                        min="0"
                        max="0.8"
                        step="0.1"
                        value={tempSettings.dimOpacity}
                        onChange={(e) => setTempSettings(prev => ({ ...prev, dimOpacity: parseFloat(e.target.value) }))}
                        className="w-full"
                      />
                      <div className="text-xs text-muted-foreground text-center">
                        {Math.round(tempSettings.dimOpacity * 100)}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between pt-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={resetSettings}
                  >
                    Reset
                  </Button>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowSettings(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={applySettings}
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Current Paragraph Highlight (for paragraph focus mode) */}
      {focusMode.type === 'paragraph' && (
        <style>{`
          .ProseMirror p:not(:hover) {
            opacity: 0.3;
            transition: opacity 0.3s ease;
          }
          .ProseMirror p:hover {
            opacity: 1;
            background: rgba(var(--primary), 0.05);
            border-radius: 8px;
            padding: 8px;
            margin: 4px 0;
          }
        `}</style>
      )}

      {/* Typewriter Mode (for typewriter focus mode) */}
      {focusMode.type === 'typewriter' && (
        <style>{`
          .ProseMirror {
            padding-top: 50vh !important;
            padding-bottom: 50vh !important;
          }
          .ProseMirror * {
            opacity: 0.1;
            transition: opacity 0.3s ease;
          }
          .ProseMirror .ProseMirror-focused {
            opacity: 1;
          }
        `}</style>
      )}
    </div>
  )
}