#!/usr/bin/env python3
"""
Ollama Manager for OpenClaw Heartbeat
Full control over Ollama: models, generation, embeddings, etc.
"""

import os
import sys
import json
import subprocess
from pathlib import Path
from typing import Optional, List, Dict

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from evolution import OllamaClient


class OllamaManager:
    """Full Ollama management for OpenClaw."""

    def __init__(self):
        self.base_url = os.getenv("OLLAMA_HOST", "http://localhost:11434")
        self.client = OllamaClient()

    # ========== Model Management ==========

    def list_models(self) -> List[Dict]:
        """List all available models."""
        models = self.client.get_available_models()
        return [{"name": m} for m in models]

    def pull_model(self, model: str) -> Dict:
        """Pull a model from Ollama."""
        result = subprocess.run(["ollama", "pull", model], capture_output=True, text=True)
        return {"status": "success" if result.returncode == 0 else "error", "output": result.stdout}

    def delete_model(self, model: str) -> Dict:
        """Delete a model."""
        result = subprocess.run(["ollama", "rm", model], capture_output=True, text=True)
        return {"status": "success" if result.returncode == 0 else "error"}

    # ========== Generation ==========

    def generate(
        self,
        prompt: str,
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 512,
    ) -> str:
        """Generate text with Ollama."""
        model = model or self.client.config.model

        response = self.client.generate(
            prompt=prompt, num_predict=max_tokens, temperature=temperature
        )
        return response.response

    def chat(self, messages: List[Dict[str, str]], model: Optional[str] = None) -> str:
        """Chat with Ollama."""
        model = model or self.client.config.model

        # Convert to Ollama format
        ollama_messages = [{"role": m["role"], "content": m["content"]} for m in messages]

        response = self.client.chat(ollama_messages)
        return response.response

    # ========== Embeddings ==========

    def create_embedding(self, text: str, model: str = "nomic-embed-text") -> List[float]:
        """Create embeddings for text."""
        import requests

        response = requests.post(
            f"{self.base_url}/api/embeddings", json={"model": model, "prompt": text}
        )
        return response.json().get("embedding", [])

    # ========== System Management ==========

    def get_stats(self) -> Dict:
        """Get Ollama statistics."""
        import requests

        try:
            response = requests.get(f"{self.base_url}/api/stats", timeout=5)
            return response.json()
        except:
            return {"error": "stats not available"}

    def check_health(self) -> Dict:
        """Check Ollama health."""
        import requests

        try:
            response = requests.get(f"{self.base_url}/api/version", timeout=5)
            return {
                "status": "healthy",
                "version": response.json().get("version"),
                "url": self.base_url,
            }
        except Exception as e:
            return {"status": "unhealthy", "error": str(e)}

    # ========== Full Control Functions ==========

    def full_status(self) -> Dict:
        """Get full status of Ollama."""
        return {
            "health": self.check_health(),
            "models": self.list_models(),
            "stats": self.get_stats(),
            "gpu_info": self.client.get_device_info(),
        }

    def run_agent_task(self, task: str) -> Dict:
        """Run an agent task with Ollama."""

        # Generate response
        response = self.generate(task)

        return {"task": task, "response": response, "model_used": self.client.config.model}

    def close(self):
        """Clean up."""
        self.client.close()


def main():
    import argparse

    parser = argparse.ArgumentParser(description="Ollama Manager for OpenClaw")
    parser.add_argument("--status", action="store_true", help="Get full status")
    parser.add_argument("--models", action="store_true", help="List models")
    parser.add_argument("--generate", type=str, help="Generate text")
    parser.add_argument("--chat", action="store_true", help="Chat mode")
    parser.add_argument("--embed", type=str, help="Create embedding")
    parser.add_argument("--health", action="store_true", help="Check health")
    parser.add_argument("--model", default="dolphin-llama3:latest", help="Model to use")

    args = parser.parse_args()

    manager = OllamaManager()

    try:
        if args.status:
            print(json.dumps(manager.full_status(), indent=2, ensure_ascii=False))

        elif args.models:
            print(json.dumps(manager.list_models(), indent=2, ensure_ascii=False))

        elif args.generate:
            result = manager.generate(args.generate, model=args.model)
            print(result)

        elif args.health:
            print(json.dumps(manager.check_health(), indent=2))

        elif args.embed:
            emb = manager.create_embedding(args.embed)
            print(f"Embedding created: {len(emb)} dimensions")

        elif args.chat:
            print("Chat mode - type 'quit' to exit")
            messages = []
            while True:
                user = input("You: ")
                if user.lower() in ["quit", "exit"]:
                    break
                messages.append({"role": "user", "content": user})
                response = manager.chat(messages, model=args.model)
                print(f"Ollama: {response}")
                messages.append({"role": "assistant", "content": response})

        else:
            parser.print_help()

    finally:
        manager.close()

    return 0


if __name__ == "__main__":
    sys.exit(main())
