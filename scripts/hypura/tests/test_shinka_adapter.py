# scripts/hypura/tests/test_shinka_adapter.py
import os
from unittest.mock import AsyncMock, MagicMock, patch

import pytest


def test_adapter_initializes_with_ollama_env() -> None:
    with patch.dict(os.environ, {}, clear=False):
        from shinka_adapter import ShinkaAdapter

        _ = ShinkaAdapter()
        assert os.environ.get("OLLAMA_BASE_URL") == "http://127.0.0.1:11434"


@pytest.mark.asyncio
async def test_evolve_code_returns_result() -> None:
    with patch("shinka_adapter.AsyncLLMClient") as MockLLM:
        mock_client = MagicMock()
        mock_client.query = AsyncMock(
            return_value=MagicMock(content='```python\nprint("evolved")\n```')
        )
        MockLLM.return_value = mock_client
        from shinka_adapter import ShinkaAdapter

        adapter = ShinkaAdapter()
        result = await adapter.evolve_code("print('hello')", "print more", generations=1)
        assert result is not None
