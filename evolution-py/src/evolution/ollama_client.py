"""
Ollama Client - Local LLM Integration
Provides interface to Ollama models for code generation and evolution.

MILSPEC Compliance:
- Error Handling: Graceful degradation
- Resource Management: Proper cleanup
- Logging: Full audit trail
"""

import logging
import time
from dataclasses import dataclass
from enum import Enum
from typing import Any, Optional

import requests
import torch

logger = logging.getLogger(__name__)


class OllamaModel(Enum):
    """Available Ollama models."""

    DOLPHIN_LLAMA3 = "dolphin-llama3:latest"
    CODELLAMA = "codellama"
    MIXTRAL = "mixtral"
    PHI3 = "phi3"
    GEMMA = "gemma"


@dataclass
class OllamaConfig:
    """Configuration for Ollama client."""

    base_url: str = "http://localhost:11434"
    model: str = "dolphin-llama3:latest"
    timeout: int = 120
    max_retries: int = 3


@dataclass
class Generation:
    """Response from LResponseLM generation."""

    response: str
    model: str
    done: bool
    context: Optional[list[int]] = None
    total_duration: Optional[int] = None
    load_duration: Optional[int] = None
    prompt_eval_count: Optional[int] = None
    eval_count: Optional[int] = None


class OllamaClient:
    """Client for Ollama local LLM API.

    Features:
    - Streaming generation
    - Multiple model support
    - Automatic device detection (CUDA/ROCm)
    - Connection pooling

    Example:
        >>> client = OllamaClient(model="dolphin-llama3:latest")
        >>> response = client.generate("Explain genetic algorithms")
        >>> print(response.response)
    """

    def __init__(self, config: Optional[OllamaConfig] = None):
        """Initialize Ollama client.

        Args:
            config: Ollama configuration
        """
        self.config = config or OllamaConfig()
        self._session = requests.Session()
        self._session.headers.update({"Content-Type": "application/json"})

        # Check available models
        self._available_models: list[str] = []
        self._check_connection()

        logger.info(
            f"OllamaClient initialized: url={self.config.base_url}, model={self.config.model}"
        )

    def _check_connection(self) -> bool:
        """Check if Ollama is running and available.

        Returns:
            True if connected
        """
        try:
            response = self._session.get(f"{self.config.base_url}/api/tags", timeout=10)
            if response.status_code == 200:
                data = response.json()
                self._available_models = [m["name"] for m in data.get("models", [])]

                # Check if requested model is available
                if self.config.model not in self._available_models:
                    logger.warning(
                        f"Model {self.config.model} not found. Available: {self._available_models}"
                    )
                    if self._available_models:
                        self.config.model = self._available_models[0]

                logger.info(f"Connected to Ollama: {self._available_models}")
                return True
        except Exception as e:
            logger.error(f"Failed to connect to Ollama: {e}")

        return False

    def generate(
        self,
        prompt: str,
        system: Optional[str] = None,
        temperature: float = 0.7,
        top_p: float = 0.9,
        top_k: int = 40,
        num_predict: int = 512,
        stop: Optional[list[str]] = None,
        stream: bool = False,
    ) -> Generation:
        """Generate text with Ollama model.

        Args:
            prompt: Input prompt
            system: System prompt
            temperature: Sampling temperature
            top_p: Nucleus sampling threshold
            top_k: Top-k sampling
            num_predict: Maximum tokens to predict
            stop: Stop sequences
            stream: Enable streaming

        Returns:
            Generation
        """
        payload = {
            "model": self.config.model,
            "prompt": prompt,
            "temperature": temperature,
            "top_p": top_p,
            "top_k": top_k,
            "num_predict": num_predict,
            "stream": stream,
            "options": {
                "num_gpu": 1  # Use GPU if available
            },
        }

        if system:
            payload["system"] = system
        if stop:
            payload["stop"] = stop

        # Retry logic
        last_error = None
        for attempt in range(self.config.max_retries):
            try:
                response = self._session.post(
                    f"{self.config.base_url}/api/generate",
                    json=payload,
                    timeout=self.config.timeout,
                    stream=stream,
                )

                if response.status_code != 200:
                    raise requests.HTTPError(f"HTTP {response.status_code}: {response.text}")

                if stream:
                    # Handle streaming
                    full_response = ""
                    for line in response.iter_lines():
                        if line:
                            data = line.decode("utf-8")
                            if data.startswith("{"):
                                import json

                                chunk = json.loads(data)
                                if "response" in chunk:
                                    full_response += chunk["response"]
                                if chunk.get("done", False):
                                    break

                    return Generation(response=full_response, model=self.config.model, done=True)
                else:
                    data = response.json()
                    return Generation(
                        response=data.get("response", ""),
                        model=data.get("model", self.config.model),
                        done=data.get("done", True),
                        context=data.get("context"),
                        total_duration=data.get("total_duration"),
                        load_duration=data.get("load_duration"),
                        prompt_eval_count=data.get("prompt_eval_count"),
                        eval_count=data.get("eval_count"),
                    )

            except Exception as e:
                last_error = e
                logger.warning(f"Generation attempt {attempt + 1} failed: {e}")
                if attempt < self.config.max_retries - 1:
                    time.sleep(2**attempt)  # Exponential backoff
                continue

        raise RuntimeError(
            f"Generation failed after {self.config.max_retries} attempts: {last_error}"
        )

    def generate_code(
        self, task: str, language: str = "python", context: Optional[str] = None
    ) -> str:
        """Generate code with specialized prompt.

        Args:
            task: Code generation task
            language: Programming language
            context: Additional context

        Returns:
            Generated code
        """
        system_prompt = f"""You are an expert {language} programmer.
Generate clean, efficient, well-documented code.
Follow best practices and MILSPEC software engineering standards.
Include error handling and logging."""

        prompt = task
        if context:
            prompt = f"Context:\n{context}\n\nTask:\n{task}"

        response = self.generate(
            prompt=prompt,
            system=system_prompt,
            temperature=0.3,  # Lower for code generation
            num_predict=2048,
        )

        # Extract code from response
        code = self._extract_code(response.response)

        return code

    def _extract_code(self, text: str) -> str:
        """Extract code from markdown-formatted response.

        Args:
            text: Response text

        Returns:
            Extracted code
        """
        import re

        # Check for code blocks
        code_block_match = re.search(r"```(?:\w+)?\n(.*?)```", text, re.DOTALL)

        if code_block_match:
            return code_block_match.group(1).strip()

        # Return original if no code blocks found
        return text.strip()

    def chat(self, messages: list[dict[str, str]], temperature: float = 0.7) -> Generation:
        """Chat completion with conversation history.

        Args:
            messages: List of message dicts with 'role' and 'content'
            temperature: Sampling temperature

        Returns:
            Generation
        """
        payload = {
            "model": self.config.model,
            "messages": messages,
            "temperature": temperature,
            "options": {"num_gpu": 1},
        }

        response = self._session.post(
            f"{self.config.base_url}/api/chat", json=payload, timeout=self.config.timeout
        )

        if response.status_code != 200:
            raise requests.HTTPError(f"HTTP {response.status_code}")

        data = response.json()

        return Generation(
            response=data.get("message", {}).get("content", ""),
            model=data.get("model", self.config.model),
            done=data.get("done", True),
        )

    def get_available_models(self) -> list[str]:
        """Get list of available models.

        Returns:
            List of model names
        """
        if not self._available_models:
            self._check_connection()
        return self._available_models

    def get_device_info(self) -> dict:
        """Get information about compute device.

        Returns:
            Device information dictionary
        """
        info = {
            "cuda_available": torch.cuda.is_available(),
            "device_count": 0,
            "device_name": "CPU",
            "memory_total": 0,
        }

        if torch.cuda.is_available():
            info["device_count"] = torch.cuda.device_count()
            info["device_name"] = torch.cuda.get_device_name(0)
            info["memory_total"] = torch.cuda.get_device_properties(0).total_memory

        return info

    def close(self) -> None:
        """Clean up resources."""
        self._session.close()
        logger.info("OllamaClient closed")


# Convenience function
def create_ollama_client(
    model: str = "dolphin-llama3:latest", base_url: str = "http://localhost:11434"
) -> OllamaClient:
    """Create configured Ollama client.

    Args:
        model: Model name
        base_url: Ollama base URL

    Returns:
        Configured OllamaClient
    """
    config = OllamaConfig(model=model, base_url=base_url)
    return OllamaClient(config)
