"""
GPU Acceleration Module - CUDA/ROCm Support
Provides hardware-aware optimization for evolution and inference.

MILSPEC Compliance:
- Hardware Detection: Automatic GPU identification
- Resource Management: Proper memory handling
- Fallback: Graceful CPU fallback
"""

import logging
import os
from dataclasses import dataclass
from enum import Enum
from typing import Optional

import torch

logger = logging.getLogger(__name__)


class ComputeBackend(Enum):
    """Available compute backends."""

    CUDA = "cuda"
    ROCM = "rocm"
    CPU = "cpu"


@dataclass
class GPUInfo:
    """Information about available GPU."""

    name: str
    memory_total: int  # bytes
    memory_free: int
    compute_capability: Optional[tuple[int, int]]
    backend: ComputeBackend
    driver_version: Optional[str] = None


@dataclass
class ComputeConfig:
    """Configuration for compute resources."""

    backend: ComputeBackend
    device_id: int = 0
    memory_fraction: float = 0.8
    allow_growth: bool = True


class GPUManager:
    """Manages GPU resources with CUDA/ROCm support.

    Features:
    - Automatic GPU detection
    - Memory management
    - Multi-GPU support
    - Unified memory awareness

    Example:
        >>> manager = GPUManager()
        >>> if manager.has_gpu():
        >>>     device = manager.get_device()
        >>>     tensor = torch.zeros(1000, device=device)
    """

    def __init__(self):
        """Initialize GPU manager."""
        self._backends: list[ComputeBackend] = []
        self._gpu_info: list[GPUInfo] = []

        self._detect_hardware()

        logger.info(
            f"GPUManager initialized: backends={self._backends}, GPUs={len(self._gpu_info)}"
        )

    def _detect_hardware(self) -> None:
        """Detect available compute hardware."""
        # Check CUDA
        if torch.cuda.is_available():
            self._backends.append(ComputeBackend.CUDA)
            self._gpu_info.extend(self._get_cuda_devices())
            logger.info(f"CUDA detected: {len(self._gpu_info)} devices")

        # Check ROCm (AMD)
        elif hasattr(torch.version, "hip") and torch.version.hip:
            self._backends.append(ComputeBackend.ROCM)
            self._gpu_info.extend(self._get_rocm_devices())
            logger.info(f"ROCm detected: {len(self._gpu_info)} devices")

        # CPU fallback
        self._backends.append(ComputeBackend.CPU)

        if not self._gpu_info:
            logger.warning("No GPU detected, using CPU only")

    def _get_cuda_devices(self) -> list[GPUInfo]:
        """Get CUDA GPU information."""
        devices = []

        for i in range(torch.cuda.device_count()):
            props = torch.cuda.get_device_properties(i)

            devices.append(
                GPUInfo(
                    name=props.name,
                    memory_total=props.total_memory,
                    memory_free=torch.cuda.mem_get_info(i)[0]
                    if hasattr(torch.cuda, "mem_get_info")
                    else props.total_memory,
                    compute_capability=(props.major, props.minor),
                    backend=ComputeBackend.CUDA,
                    driver_version=props.cuda_version if hasattr(props, "cuda_version") else None,
                )
            )

        return devices

    def _get_rocm_devices(self) -> list[GPUInfo]:
        """Get ROCm GPU information."""
        devices = []

        # ROCm detection
        for i in range(torch.cuda.device_count()):
            props = torch.cuda.get_device_properties(i)

            devices.append(
                GPUInfo(
                    name=props.name,
                    memory_total=props.total_memory,
                    memory_free=props.total_memory,  # ROCm doesn't have mem_get_info equivalent
                    compute_capability=None,
                    backend=ComputeBackend.ROCM,
                )
            )

        return devices

    def has_gpu(self) -> bool:
        """Check if any GPU is available.

        Returns:
            True if GPU available
        """
        return len(self._gpu_info) > 0

    def get_device(
        self, backend: Optional[ComputeBackend] = None, device_id: int = 0
    ) -> torch.device:
        """Get torch device for computation.

        Args:
            backend: Preferred backend (auto-detect if None)
            device_id: GPU device ID

        Returns:
            torch.device
        """
        if backend is None:
            backend = self._get_fastest_backend()

        if backend == ComputeBackend.CUDA and torch.cuda.is_available():
            return torch.device(f"cuda:{device_id}")
        elif backend == ComputeBackend.ROCM and hasattr(torch.version, "hip"):
            return torch.device(f"hip:{device_id}")
        else:
            return torch.device("cpu")

    def _get_fastest_backend(self) -> ComputeBackend:
        """Get fastest available backend.

        Returns:
            ComputeBackend
        """
        if ComputeBackend.CUDA in self._backends:
            return ComputeBackend.CUDA
        elif ComputeBackend.ROCM in self._backends:
            return ComputeBackend.ROCM
        else:
            return ComputeBackend.CPU

    def get_info(self) -> dict:
        """Get comprehensive GPU/ hardware information.

        Returns:
            Hardware info dictionary
        """
        return {
            "backends": [b.value for b in self._backends],
            "gpu_count": len(self._gpu_info),
            "gpus": [
                {
                    "name": gpu.name,
                    "memory_total_gb": gpu.memory_total / 1e9,
                    "memory_free_gb": gpu.memory_free / 1e9,
                    "compute_capability": f"{gpu.compute_capability[0]}.{gpu.compute_capability[1]}"
                    if gpu.compute_capability
                    else "N/A",
                    "backend": gpu.backend.value,
                }
                for gpu in self._gpu_info
            ],
            "cuda_available": torch.cuda.is_available(),
            "rocm_available": hasattr(torch.version, "hip") and torch.version.hip is not None,
        }

    def optimize_for_inference(
        self, model_size_mb: float, config: Optional[ComputeConfig] = None
    ) -> ComputeConfig:
        """Optimize compute configuration for inference.

        Args:
            model_size_mb: Model size in MB
            config: Existing config (create new if None)

        Returns:
            Optimized ComputeConfig
        """
        if config is None:
            config = ComputeConfig(backend=self._get_fastest_backend())

        if not self.has_gpu():
            config.backend = ComputeBackend.CPU
            return config

        # Get available memory
        gpu = self._gpu_info[config.device_id]
        available_memory = gpu.memory_free

        # Check if model fits in GPU memory
        model_size_bytes = model_size_mb * 1024 * 1024

        if model_size_bytes > available_memory * config.memory_fraction:
            logger.warning(
                f"Model ({model_size_mb:.0f}MB) may not fit in GPU "
                f"({gpu.memory_free / 1e9:.1f}GB available)"
            )
            # Suggest quantization or CPU
            if model_size_bytes > available_memory * 0.5:
                logger.info("Consider using quantization or offloading")

        return config

    def set_memory_fraction(self, fraction: float) -> None:
        """Set GPU memory fraction for this process.

        Args:
            fraction: Fraction of GPU memory (0-1)
        """
        if torch.cuda.is_available():
            torch.cuda.set_per_process_memory_fraction(fraction)
            logger.info(f"GPU memory fraction set to {fraction}")

    def clear_cache(self) -> None:
        """Clear GPU memory cache."""
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
            logger.debug("GPU cache cleared")

    def synchronize(self) -> None:
        """Synchronize all GPU operations."""
        if torch.cuda.is_available():
            torch.cuda.synchronize()


# Global instance
_gpu_manager = GPUManager()


def get_gpu_manager() -> GPUManager:
    """Get global GPU manager instance.

    Returns:
        GPUManager instance
    """
    return _gpu_manager


def get_optimal_device() -> torch.device:
    """Get optimal device for computation.

    Returns:
        torch.device
    """
    return _gpu_manager.get_device()
