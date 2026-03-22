import numpy as np
import datetime
import sqlite3
import json
from typing import List, Dict, Any, Optional

class AdvancedRecallManager:
    """
    Implements a sophisticated memory recall system for Hakua.
    Uses 'Emotional Resonance' (intensity of interaction) and 
    'Importance Weighting' (relevance to core values) to prioritize memories.
    Incorporates the Ebbinghaus Forgetting Curve for temporal decay.
    """
    def __init__(self, db_path: str = "AGENTS.db"):
        self.db_path = db_path
        self._init_db()

    def _init_db(self):
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS memory_nodes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    content TEXT NOT NULL,
                    emotional_valence REAL,  -- -1.0 to 1.0 (Sentiment)
                    emotional_intensity REAL, -- 0.0 to 1.0 (Impact)
                    importance REAL,          -- 0.0 to 1.0 (User-defined/AI-inferred)
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    tags TEXT
                )
            """)

    def calculate_recall_score(self, memory: Dict[str, Any], query_embedding: Optional[np.ndarray] = None) -> float:
        """
        Calculates the probability of recall based on:
        S = (Intensity * Importance * SemanticSimilarity) / (1 + Decay)
        """
        now = datetime.datetime.now()
        created_at = datetime.datetime.strptime(memory['timestamp'], '%Y-%m-%d %H:%M:%S')
        delta_hours = (now - created_at).total_seconds() / 3600.0
        
        # Ebbinghaus-like decay: R = e^(-t/S) where S is 'strength'
        strength = memory['emotional_intensity'] * memory['importance'] + 0.1
        decay = np.exp(-delta_hours / (strength * 24.0)) # 24h as a base scale
        
        # Resonance logic
        resonance = memory['emotional_intensity'] * memory['importance']
        
        return resonance * decay

    def store_memory(self, content: str, valence: float, intensity: float, importance: float, tags: List[str]):
        """
        Stores a new processed memory node.
        """
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                INSERT INTO memory_nodes (content, emotional_valence, emotional_intensity, importance, tags)
                VALUES (?, ?, ?, ?, ?)
            """, (content, valence, intensity, importance, json.dumps(tags)))

    def recall_top_memories(self, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Retrieves the most 'resonant' memories currently available.
        """
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute("SELECT * FROM memory_nodes")
            memories = [dict(row) for row in cursor.fetchall()]
            
        # Score and sort
        for m in memories:
            m['recall_score'] = self.calculate_recall_score(m)
            
        memories.sort(key=lambda x: x['recall_score'], reverse=True)
        return memories[:limit]

if __name__ == "__main__":
    recall = AdvancedRecallManager()
    # Test memory injection
    recall.store_memory(
        content="User expressed deep gratitude for help with the SO8T project.",
        valence=0.8,
        intensity=0.9,
        importance=1.0,
        tags=["SO8T", "Relationship", "Success"]
    )
    top = recall.recall_top_memories()
    print(f"Top recalled memory: {top[0]['content']} (Score: {top[0]['recall_score']:.4f})")
