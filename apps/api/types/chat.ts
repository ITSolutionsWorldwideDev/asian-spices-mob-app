export type ChatRole = "user" | "assistant" | "system";

export type BackendConnectionStatus =
  | "connected"
  | "mock"
  | "unreachable";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: string;
  csvUrl?: string | null;
  previewTable?: PreviewTableRow[] | null;
  images?: BibiImageResult[] | null;
  videos?: BibiVideoResult[] | null;
  status?: "sending" | "sent" | "error";
  errorMessage?: string | null;
};

export type ChatRequest = {
  message: string;
  conversationId: string | null;
  metadata?: {
    source: "bibi-frontend";
    company: "Asian Spices";
    agent: "Bibi";
  };
};

export type ChatResponse = {
  reply: string;
  conversationId: string | null;
};

export type PreviewTableRow = Record<string, string | number | boolean | null>;

export type BibiImageResult = {
  url: string;
  alt?: string | null;
};

export type BibiVideoResult = {
  url: string;
  title?: string | null;
  poster?: string | null;
};

export type BibiApiResult = ChatResponse & {
  isMock: boolean;
  connectionStatus: BackendConnectionStatus;
  endpointUrl: string | null;
  csvUrl?: string | null;
  previewTable?: PreviewTableRow[] | null;
  images?: BibiImageResult[] | null;
  videos?: BibiVideoResult[] | null;
  raw?: unknown;
};
