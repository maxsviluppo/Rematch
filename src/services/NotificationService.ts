import { io, Socket } from "socket.io-client";

class NotificationService {
  private socket: Socket | null = null;

  init(userId: string) {
    if (this.socket) return;

    this.socket = io(window.location.origin, {
      query: { userId }
    });

    this.socket.on("notification", (data: { title: string; body: string; type: string; data?: any }) => {
      this.showBrowserNotification(data.title, data.body);
    });

    this.socket.on("connect", () => {
      console.log("Connected to notification server");
    });
  }

  async requestPermission() {
    if (!("Notification" in window)) {
      console.log("This browser does not support desktop notification");
      return false;
    }

    if (Notification.permission === "granted") {
      return true;
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }

    return false;
  }

  private showBrowserNotification(title: string, body: string) {
    if (Notification.permission === "granted") {
      new Notification(title, {
        body,
        icon: "/favicon.ico", // Fallback icon
      });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const notificationService = new NotificationService();
