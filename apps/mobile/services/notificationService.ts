import { refreshNextAuthSession } from "@/services/api/authService";
import { ApiRequestError, apiRequest } from "@/services/api/httpClient";
import type { AppNotification } from "@/types/notification";

type NotificationsApiResponse = {
  notifications?: AppNotification[];
  unreadCount?: number;
  error?: string;
};

async function apiRequestWithSessionRetry<T>(
  path: string,
  options?: Omit<RequestInit, "body"> & { body?: unknown },
): Promise<T> {
  try {
    return await apiRequest<T>(path, options);
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 401) {
      const refreshed = await refreshNextAuthSession();
      if (refreshed) {
        return apiRequest<T>(path, options);
      }
    }
    throw error;
  }
}

export async function getNotifications(): Promise<AppNotification[]> {
  try {
    const payload = await apiRequestWithSessionRetry<NotificationsApiResponse>(
      "/api/account/notifications",
    );
    return Array.isArray(payload.notifications) ? payload.notifications : [];
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 401) {
      return [];
    }
    console.error("Failed to load notifications", error);
    return [];
  }
}

export async function getUnreadCount(): Promise<number> {
  try {
    const payload = await apiRequestWithSessionRetry<NotificationsApiResponse>(
      "/api/account/notifications?limit=1",
    );
    if (typeof payload.unreadCount === "number") {
      return payload.unreadCount;
    }
    return (payload.notifications ?? []).filter((item) => !item.isRead).length;
  } catch {
    return 0;
  }
}

export async function markNotificationAsRead(id: string): Promise<void> {
  await apiRequestWithSessionRetry("/api/account/notifications/read", {
    method: "POST",
    body: { id },
  });
}

export async function markAllNotificationsAsRead(): Promise<void> {
  await apiRequestWithSessionRetry("/api/account/notifications/read", {
    method: "POST",
    body: { all: true },
  });
}
