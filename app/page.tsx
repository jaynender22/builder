"use client";

import { useState } from "react";

type Block = {
  id: string;
  text: string;
};

export default function HomePage() {
  const [rawText, setRawText] = useState("");
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);

  function handleParse() {
    // Very simple split: each non-empty line becomes a block
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
  }

  function updateBlockText(id: string, newText: string) {
    setBlocks((prev) =>
      prev.map((block) =>
        block.id === id ? { ...block, text: newText } : block
      )
    );
  }

  const activeBlock = blocks.find((b) => b.id === activeBlockId) || null;

  return (
    <main style={{ padding: "20px", fontFamily: "sans-serif" }}>
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
        {/* Left side: active block info (chat area later) */}
        <div
          style={{
            border: "1px solid #ccc",
            borderRadius: "8px",
            padding: "12px",
            minHeight: "200px",
          }}
        >
          <h2 style={{ fontSize: "18px", marginBottom: "8px" }}>
            Current Block (Chat goes here later)
          </h2>
          {activeBlock ? (
            <>
              <p style={{ fontSize: "14px", color: "#666" }}>Block text:</p>
              <div
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  padding: "8px",
                  backgroundColor: "#fafafa",
                  whiteSpace: "pre-wrap",
                  fontSize: "14px",
                }}
              >
                {activeBlock.text}
              </div>
            </>
          ) : (
            <p>No block selected yet.</p>
          )}
        </div>

        {/* Right side: list of editable blocks */}
        <div
          style={{
            border: "1px solid #ccc",
            borderRadius: "8px",
            padding: "12px",
            minHeight: "200px",
          }}
        >
          <h2 style={{ fontSize: "18px", marginBottom: "8px" }}>
            Resume Blocks
          </h2>
          {blocks.length === 0 ? (
            <p>No blocks yet. Paste your resume and click "Parse".</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {blocks.map((block) => (
                <div
                  key={block.id}
                  style={{
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    padding: "8px",
                    backgroundColor:
                      block.id === activeBlockId ? "#eef6ff" : "white",
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
                    <span style={{ fontSize: "12px", color: "#666" }}>
                      {block.id}
                    </span>
                    <button
                      onClick={() => setActiveBlockId(block.id)}
                      style={{
                        fontSize: "12px",
                        padding: "4px 8px",
                        cursor: "pointer",
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
                    style={{ width: "100%", fontSize: "14px", padding: "4px" }}
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

