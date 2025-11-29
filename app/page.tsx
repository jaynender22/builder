"use client";

import React, { useState, KeyboardEvent } from "react";

type Block = {
  id: string;
  text: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  canApply?: boolean; // true when this message is a suggestion we can apply
};

export default function HomePage() {
  const [rawText, setRawText] = useState("");
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);

  const [chatsByBlockId, setChatsByBlockId] = useState<
    Record<string, ChatMessage[]>
  >({});
  const [chatInput, setChatInput] = useState("");

  function handleParse() {
    const lines = rawText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const newBlocks: Block[] = lines.map((line, index) => ({
      id: `block-${index}`,
      text: line,
    }));

    setBlocks(newBlocks);
    setActiveBlockId(newBlocks[0]?.id ?? null);
    setChatsByBlockId({}); // reset chats when parsing new text
  }

  function updateBlockText(id: string, newText: string) {
    setBlocks((prev) =>
      prev.map((block) =>
        block.id === id ? { ...block, text: newText } : block
      )
    );
  }

  function applySuggestionToActiveBlock(suggestion: string) {
    if (!activeBlockId) return;
    setBlocks((prev) =>
      prev.map((block) =>
        block.id === activeBlockId ? { ...block, text: suggestion } : block
      )
    );
  }

  async function handleSendChat() {
    if (!activeBlockId) return;
    const trimmed = chatInput.trim();
    if (!trimmed) return;

    const activeBlock = blocks.find((b) => b.id === activeBlockId);
    if (!activeBlock) return;

    const currentMessages = chatsByBlockId[activeBlockId] ?? [];

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: "user",
      content: trimmed,
    };

    const messagesWithUser = [...currentMessages, userMessage];
    setChatsByBlockId((prev) => ({
      ...prev,
      [activeBlockId]: messagesWithUser,
    }));
    setChatInput("");

    try {
      const res = await fetch("/api/ai-edit-block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blockText: activeBlock.text,
          userPrompt: trimmed,
        }),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        // ignore JSON parse errors
      }

      if (!res.ok) {
        const msg =
          data?.error || `HTTP ${res.status} while calling /api/ai-edit-block`;
        throw new Error(msg);
      }

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: "assistant",
        content: data?.suggestedText ?? "No suggestion returned.",
        canApply: !!data?.suggestedText,
      };

      setChatsByBlockId((prev) => ({
        ...prev,
        [activeBlockId]: [...messagesWithUser, assistantMessage],
      }));
    } catch (error) {
      console.error("Error sending chat:", error);
      const msg =
        error instanceof Error
          ? error.message
          : "Unknown error calling the AI.";

      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}-assistant-error`,
        role: "assistant",
        content: msg,
        canApply: false,
      };

      setChatsByBlockId((prev) => ({
        ...prev,
        [activeBlockId]: [...messagesWithUser, errorMessage],
      }));
    }
  }

  const activeBlock = blocks.find((b) => b.id === activeBlockId) || null;
  const activeChatMessages =
    (activeBlockId ? chatsByBlockId[activeBlockId] : []) ?? [];

  function handleChatKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendChat();
    }
  }

  return (
    <main
      style={{
        padding: "20px",
        fontFamily: "sans-serif",
        maxWidth: "1200px",
        margin: "0 auto",
      }}
    >
      <h1 style={{ fontSize: "24px", marginBottom: "12px" }}>
        Resume Block Editor (Prototype)
      </h1>

      {/* Paste resume */}
      <div style={{ marginBottom: "16px" }}>
        <label style={{ display: "block", marginBottom: "8px" }}>
          Paste your resume text here:
        </label>
        <textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          rows={6}
          style={{ width: "100%", padding: "8px" }}
          placeholder="Paste your resume here..."
        />
        <button
          onClick={handleParse}
          style={{
            marginTop: "8px",
            padding: "8px 16px",
            cursor: "pointer",
          }}
        >
          Parse into blocks
        </button>
      </div>

      {/* Two-column layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 2fr",
          gap: "16px",
          marginTop: "16px",
        }}
      >
        {/* Left side: active block + chat */}
        <div
          style={{
            border: "1px solid #444",
            borderRadius: "8px",
            padding: "12px",
            minHeight: "260px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <h2 style={{ fontSize: "18px" }}>Current Block & Chat</h2>

          {activeBlock ? (
            <>
              {/* Block preview */}
              <div
                style={{
                  border: "1px solid #333",
                  borderRadius: "4px",
                  padding: "8px",
                  backgroundColor: "#111",
                  whiteSpace: "pre-wrap",
                  fontSize: "14px",
                }}
              >
                {activeBlock.text}
              </div>

              {/* Chat messages */}
              <div
                style={{
                  flex: 1,
                  border: "1px solid #333",
                  borderRadius: "4px",
                  padding: "8px",
                  overflowY: "auto",
                  maxHeight: "250px",
                  backgroundColor: "#050505",
                }}
              >
                {activeChatMessages.length === 0 ? (
                  <p style={{ fontSize: "13px", color: "#888" }}>
                    No chat yet. Type a prompt below to start editing this
                    block.
                  </p>
                ) : (
                  activeChatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      style={{
                        marginBottom: "8px",
                        textAlign: msg.role === "user" ? "right" : "left",
                      }}
                    >
                      <div
                        style={{
                          display: "inline-block",
                          padding: "6px 8px",
                          borderRadius: "12px",
                          fontSize: "13px",
                          backgroundColor:
                            msg.role === "user" ? "#2563eb" : "#333",
                          color: "white",
                          maxWidth: "100%",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {msg.content}
                      </div>

                      {/* Apply button for assistant suggestions */}
                      {msg.role === "assistant" && msg.canApply && (
                        <div
                          style={{
                            marginTop: "4px",
                            display: "inline-block",
                          }}
                        >
                          <button
                            onClick={() =>
                              applySuggestionToActiveBlock(msg.content)
                            }
                            style={{
                              fontSize: "11px",
                              padding: "4px 8px",
                              borderRadius: "999px",
                              border: "1px solid #4ade80",
                              backgroundColor: "transparent",
                              color: "#bbf7d0",
                              cursor: "pointer",
                            }}
                          >
                            Apply to block
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Chat input */}
              <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Tell the AI how to improve this block..."
                  style={{
                    flex: 1,
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #555",
                    fontSize: "14px",
                    backgroundColor: "#111",
                    color: "white",
                  }}
                  onKeyDown={handleChatKeyDown}
                />
                <button
                  onClick={handleSendChat}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "4px",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "14px",
                    backgroundColor: "#22c55e",
                    color: "black",
                    fontWeight: 600,
                  }}
                >
                  Send
                </button>
              </div>
            </>
          ) : (
            <p>No block selected yet. Parse and focus a block to start.</p>
          )}
        </div>

        {/* Right side: list of editable blocks */}
        <div
          style={{
            border: "1px solid #444",
            borderRadius: "8px",
            padding: "12px",
            minHeight: "260px",
          }}
        >
          <h2 style={{ fontSize: "18px", marginBottom: "8px" }}>
            Resume Blocks
          </h2>
          {blocks.length === 0 ? (
            <p>No blocks yet. Paste your resume and click "Parse".</p>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              {blocks.map((block) => (
                <div
                  key={block.id}
                  style={{
                    border: "1px solid #333",
                    borderRadius: "4px",
                    padding: "8px",
                    backgroundColor:
                      block.id === activeBlockId ? "#111827" : "black",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "4px",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontSize: "12px", color: "#888" }}>
                      {block.id}
                    </span>
                    <button
                      onClick={() => setActiveBlockId(block.id)}
                      style={{
                        fontSize: "12px",
                        padding: "4px 8px",
                        cursor: "pointer",
                        borderRadius: "4px",
                        border: "1px solid #555",
                        backgroundColor:
                          block.id === activeBlockId ? "#2563eb" : "#111",
                        color: "white",
                      }}
                    >
                      Focus this block
                    </button>
                  </div>
                  <textarea
                    value={block.text}
                    onChange={(e) =>
                      updateBlockText(block.id, e.target.value)
                    }
                    rows={2}
                    style={{
                      width: "100%",
                      fontSize: "14px",
                      padding: "4px",
                      backgroundColor: "#020617",
                      color: "white",
                      borderRadius: "4px",
                      border: "1px solid #333",
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
