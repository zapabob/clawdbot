import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Optional

class ResidualAdapter(nn.Module):
    """
    Standard residual adapter block with a bottleneck architecture.
    """
    def __init__(self, d_model: int, r: int):
        super().__init__()
        self.down = nn.Linear(d_model, r, bias=False)
        self.up = nn.Linear(r, d_model, bias=False)
        self.act = nn.GELU()

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # Bottleneck projection
        return self.up(self.act(self.down(x)))

class SO8TAdapterBank(nn.Module):
    """
    SO8T Adapter Bank: Manages 4 separate adapters (one per reasoning pass).
    Includes learnable gate coefficients (alpha) for each pass.
    """
    def __init__(self, d_model: int, r: int, num_passes: int = 4):
        super().__init__()
        self.num_passes = num_passes
        
        # 4 Adapters for each pass: 0=Task, 1=Safety, 2=Policy, 3=Final
        self.adapters = nn.ModuleList([
            ResidualAdapter(d_model, r) for _ in range(num_passes)
        ])
        
        # Learnable gate coefficients alpha_{pass}. 
        # Initialized to zero for stability (starts as identity).
        self.alpha = nn.Parameter(torch.zeros(num_passes))

    def forward(self, x: torch.Tensor, pass_id: int) -> torch.Tensor:
        """
        Applies the adapter for the specific pass_id.
        """
        if pass_id < 0 or pass_id >= self.num_passes:
            raise ValueError(f"Invalid pass_id: {pass_id}. Must be between 0 and {self.num_passes - 1}.")
            
        adapter_output = self.adapters[pass_id](x)
        return x + self.alpha[pass_id] * adapter_output

def calculate_pet_loss(adapter_banks: nn.ModuleList, lambda_g: float) -> torch.Tensor:
    """
    Calculates the Second-Order Difference (PET) loss on adapter gate coefficients.
    L_PET = lambda_g * \sum_{l} \sum_{p=2}^{3} (alpha_{l,p+1} - 2*alpha_{l,p} + alpha_{l,p-1})^2
    """
    total_loss = 0.0
    for bank in adapter_banks:
        alpha = bank.alpha  # [num_passes]
        if alpha.size(0) >= 3:
            # d2: p=1 (alpha[2] - 2*alpha[1] + alpha[0])
            d2 = alpha[2] - 2.0 * alpha[1] + alpha[0]
            total_loss += d2.pow(2)
            
            if alpha.size(0) >= 4:
                # d3: p=2 (alpha[3] - 2*alpha[2] + alpha[1])
                d3 = alpha[3] - 2.0 * alpha[2] + alpha[1]
                total_loss += d3.pow(2)
                
    return lambda_g * total_loss
