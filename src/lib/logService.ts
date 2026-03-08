type LogLevel = 'info' | 'warn' | 'error' | 'success';

interface SystemLog {
    id: string;
    timestamp: string;
    level: LogLevel;
    module: string;
    message: string;
}

class LogService {
    private logs: SystemLog[] = [];
    private listeners: ((logs: SystemLog[]) => void)[] = [];

    addLog(module: string, message: string, level: LogLevel = 'info') {
        const newLog: SystemLog = {
            id: Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toLocaleTimeString(),
            level,
            module,
            message
        };

        this.logs = [newLog, ...this.logs].slice(0, 50); // Keep last 50
        this.notify();
    }

    getLogs() {
        return this.logs;
    }

    subscribe(listener: (logs: SystemLog[]) => void) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    private notify() {
        this.listeners.forEach(l => l(this.logs));
    }
}

export const systemLogs = new LogService();
