"use client";

import React, { useEffect, useState } from "react";
import { getStoredGuestUser } from "@/lib/guest-session";

interface LeaderboardItem {
  rank: number;
  id: string;
  guestId?: string;
  nickname: string;
  score: number;
  difficulty?: string;
  clearTime?: number;
  wave?: number;
  createdAt?: string;
}

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameId: "defense" | "tetris" | "blob" | "maze";
  gameTitle: string;
}

export function LeaderboardModal({ isOpen, onClose, gameId, gameTitle }: LeaderboardModalProps) {
  const [scores, setScores] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [dbConnected, setDbConnected] = useState(true);
  const [dbMessage, setDbMessage] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("ALL");

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    queueMicrotask(() => {
      if (isMounted) setLoading(true);
    });

    const url = `/api/scores?gameId=${gameId}${
      difficultyFilter !== "ALL" ? `&difficulty=${difficultyFilter}` : ""
    }`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        setDbConnected(Boolean(data.dbConnected));
        if (!data.dbConnected) {
          setDbMessage(data.message || "MongoDB connecting pending. Add MONGODB_URI to .env to enable database.");
        }
        setScores(data.scores || []);
      })
      .catch((err) => {
        console.error("Leaderboard fetch error:", err);
        if (isMounted) {
          setDbConnected(false);
          setDbMessage("MongoDB connection unavailable.");
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, gameId, difficultyFilter]);

  if (!isOpen) return null;

  const currentUser = getStoredGuestUser();

  return (
    <div className="leaderboard-overlay" onClick={onClose}>
      <div
        className="leaderboard-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="leaderboard-header">
          <div>
            <div className="play-kicker" style={{ fontSize: "11px", letterSpacing: "0.15em" }}>
              GLOBAL RANKINGS
            </div>
            <h3 style={{ margin: "4px 0 0", fontSize: "1.3rem", fontWeight: 700 }}>
              🏆 {gameTitle} Leaderboard
            </h3>
          </div>
          <button className="leaderboard-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Status Bar / Filter */}
        <div className="leaderboard-status-bar">
          <div className="leaderboard-user-badge">
            <span style={{ opacity: 0.6 }}>Player:</span> <strong>{currentUser.nickname}</strong>
          </div>
          {gameId === "defense" && (
            <div className="leaderboard-diff-filter">
              {["ALL", "EASY", "NORMAL", "HARD"].map((diff) => (
                <button
                  key={diff}
                  className={`diff-tag ${difficultyFilter === diff ? "active" : ""}`}
                  onClick={() => setDifficultyFilter(diff)}
                >
                  {diff}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* DB Connection Alert Notice */}
        {!dbConnected && (
          <div className="leaderboard-db-notice">
            <div className="notice-icon">⚡</div>
            <div className="notice-text">
              <strong>MongoDB ENV Pending:</strong> {dbMessage}
              <br />
              <span style={{ fontSize: "0.8rem", opacity: 0.8 }}>
                (Scores are stored in browser localStorage until MongoDB_URI is populated)
              </span>
            </div>
          </div>
        )}

        {/* Scores List Table */}
        <div className="leaderboard-list-container">
          {loading ? (
            <div className="leaderboard-loading">Loading Rankings...</div>
          ) : scores.length === 0 ? (
            <div className="leaderboard-empty">
              {dbConnected
                ? "No recorded scores yet. Be the first liquid champion!"
                : "Database is waiting for MONGODB_URI in your .env file."}
            </div>
          ) : (
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th className="th-center">RANK</th>
                  <th>PLAYER</th>
                  {gameId === "defense" && <th className="th-center">WAVE</th>}
                  {gameId === "maze" && <th className="th-center">TIME</th>}
                  <th className="th-right">SCORE</th>
                </tr>
              </thead>
              <tbody>
                {scores.map((item) => {
                  const isCurrent = item.guestId === currentUser.guestId;
                  return (
                    <tr key={item.id} className={isCurrent ? "is-user-row" : ""}>
                      <td className="rank-cell td-center">
                        {item.rank === 1 ? "🥇 1st" : item.rank === 2 ? "🥈 2nd" : item.rank === 3 ? "🥉 3rd" : `#${item.rank}`}
                      </td>
                      <td className="player-cell">
                        {item.nickname}
                        {isCurrent && <span className="you-badge">YOU</span>}
                      </td>
                      {gameId === "defense" && <td className="td-center">Wave {item.wave ?? "-"}</td>}
                      {gameId === "maze" && <td className="td-center">{item.clearTime ? `${item.clearTime.toFixed(1)}s` : "-"}</td>}
                      <td className="score-cell td-right">{item.score.toLocaleString()} Pts</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="leaderboard-footer">
          <span>PlayGround v2 Liquid DB System</span>
          <button className="leaderboard-refresh-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>

      <style jsx>{`
        .leaderboard-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: rgba(6, 9, 17, 0.75);
          backdrop-filter: blur(16px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: fadeIn 0.2s ease-out;
        }

        .leaderboard-modal {
          width: 100%;
          max-width: 580px;
          background: color-mix(in srgb, var(--ink, #060911) 90%, transparent);
          border: 1px solid color-mix(in srgb, var(--paper, #fff) 25%, transparent);
          border-radius: 0;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          max-height: 85vh;
          color: var(--paper, #fff);
          font-family: var(--font-manrope), sans-serif;
        }

        .leaderboard-header {
          padding: 20px 24px 16px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 1px solid color-mix(in srgb, var(--paper, #fff) 12%, transparent);
        }

        .leaderboard-close-btn {
          background: transparent;
          border: 1px solid color-mix(in srgb, var(--paper, #fff) 20%, transparent);
          color: var(--paper, #fff);
          width: 32px;
          height: 32px;
          border-radius: 0;
          cursor: pointer;
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }
        .leaderboard-close-btn:hover {
          background: color-mix(in srgb, var(--paper, #fff) 15%, transparent);
        }

        .leaderboard-status-bar {
          padding: 12px 24px;
          background: color-mix(in srgb, var(--paper, #fff) 5%, transparent);
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.85rem;
          border-bottom: 1px solid color-mix(in srgb, var(--paper, #fff) 8%, transparent);
        }

        .leaderboard-diff-filter {
          display: flex;
          gap: 6px;
        }

        .diff-tag {
          background: transparent;
          border: 1px solid color-mix(in srgb, var(--paper, #fff) 15%, transparent);
          color: var(--paper, #fff);
          padding: 3px 8px;
          border-radius: 0;
          font-size: 0.75rem;
          cursor: pointer;
        }
        .diff-tag.active {
          background: var(--acid, #38bdf8);
          color: #060911;
          font-weight: 700;
          border-color: var(--acid, #38bdf8);
        }

        .leaderboard-db-notice {
          margin: 12px 24px 0;
          padding: 12px 16px;
          background: rgba(234, 179, 8, 0.12);
          border: 1px solid rgba(234, 179, 8, 0.3);
          border-radius: 0;
          display: flex;
          gap: 12px;
          align-items: center;
          font-size: 0.85rem;
          color: #fde047;
        }

        .leaderboard-list-container {
          padding: 16px 24px;
          overflow-y: auto;
          flex: 1;
          min-height: 220px;
        }

        .leaderboard-loading,
        .leaderboard-empty {
          text-align: center;
          padding: 40px 0;
          opacity: 0.7;
          font-size: 0.95rem;
        }

        .leaderboard-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.9rem;
        }

        .leaderboard-table th {
          text-align: left;
          padding: 10px 12px;
          font-size: 0.75rem;
          letter-spacing: 0.1em;
          opacity: 0.6;
          border-bottom: 1px solid color-mix(in srgb, var(--paper, #fff) 12%, transparent);
        }

        .leaderboard-table th.th-center,
        .leaderboard-table td.td-center {
          text-align: center;
        }

        .leaderboard-table th.th-right,
        .leaderboard-table td.td-right {
          text-align: right;
        }

        .leaderboard-table td {
          padding: 12px 12px;
          border-bottom: 1px solid color-mix(in srgb, var(--paper, #fff) 6%, transparent);
          vertical-align: middle;
        }

        .leaderboard-table tr.is-user-row {
          background: color-mix(in srgb, var(--acid, #38bdf8) 18%, transparent);
          box-shadow: inset 2px 0 0 var(--acid, #38bdf8);
        }

        .rank-cell {
          font-weight: 700;
          font-family: var(--font-manrope), monospace, sans-serif;
        }

        .score-cell {
          font-weight: 800;
          color: var(--acid, #38bdf8);
          font-family: var(--font-manrope), monospace, sans-serif;
          font-size: 0.95rem;
          letter-spacing: 0.04em;
        }

        .you-badge {
          display: inline-block;
          margin-left: 8px;
          padding: 2px 6px;
          font-size: 0.65rem;
          background: var(--acid, #38bdf8);
          color: #060911;
          font-weight: 800;
          border-radius: 0;
        }

        .leaderboard-footer {
          padding: 14px 24px;
          background: color-mix(in srgb, var(--paper, #fff) 3%, transparent);
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.75rem;
          opacity: 0.7;
          border-top: 1px solid color-mix(in srgb, var(--paper, #fff) 8%, transparent);
        }

        .leaderboard-refresh-btn {
          background: color-mix(in srgb, var(--paper, #fff) 12%, transparent);
          border: none;
          color: #fff;
          padding: 6px 16px;
          border-radius: 0;
          cursor: pointer;
          font-weight: 600;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
