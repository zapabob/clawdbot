import torch
import torch.nn as nn
from typing import Optional

def sinkhorn_knopp(W: torch.Tensor, iterations: int = 5, epsilon: float = 1e-8) -> torch.Tensor:
    """
    Applies the Sinkhorn-Knopp algorithm to project a matrix onto the manifold of 
    doubly stochastic matrices. This ensures both rows and columns sum to 1.
    """
    # Ensure non-negativity (as per mHC requirements for convex combination)
    W = torch.relu(W) + epsilon
    
    for _ in range(iterations):
        # Row normalization
        W = W / (W.sum(dim=-1, keepdim=True) + epsilon)
        # Column normalization
        W = W / (W.sum(dim=-2, keepdim=True) + epsilon)
        
    return W

class MHCResidualConnection(nn.Module):
    """
    Manifold-Constrained Hyper-Connections (mHC).
    Instead of a simple residual add (x + f(x)), it uses a constrained mixing 
    matrix to prevent signal amplification.
    """
    def __init__(self, d_model: int):
        super().__init__()
        # Mixing weights for the hyper-connection
        self.mixing_weights = nn.Parameter(torch.ones(2, 2) / 2.0)

    def forward(self, x: torch.Tensor, fx: torch.Tensor) -> torch.Tensor:
        """
        x: original residual stream
        fx: output of the current layer (e.g., MLP or Attn)
        """
        # Constrain weights to be doubly stochastic
        W = sinkhorn_knopp(self.mixing_weights)
        
        # Apply mixing (simplified for a single connection pair)
        # In a full mHC, this would mix across multiple parallel paths if they existed.
        return W[0, 0] * x + W[0, 1] * fx
