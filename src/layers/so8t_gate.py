import torch
import torch.nn as nn
from typing import Optional

class SO8RotationGate(nn.Module):
    """
    SO(8) Rotation Gate using the Cayley transformation:
    R = (I - A)(I + A)^-1 where A is a skew-symmetric matrix.
    Ensures R is an orthogonal matrix (R^T R = I) with det(R) = 1.
    """
    def __init__(self, dim: int = 8):
        super().__init__()
        if dim != 8:
            # SO(8) is the target, but we support generalize dim.
            pass
        self.dim = dim
        # Skew-symmetric generator: Only dim*(dim-1)//2 parameters are needed.
        # But we store the full matrix for simplicity and enforce skew-symmetry.
        self.A_gen = nn.Parameter(torch.randn(dim, dim) * 0.01)

    def get_rotation_matrix(self) -> torch.Tensor:
        """
        Computes the orthogonal matrix R using the Cayley transform.
        A = A_gen - A_gen^T (ensures skew-symmetry)
        R = (I - A) @ inv(I + A)
        """
        # Enforce skew-symmetry
        A = self.A_gen - self.A_gen.transpose(0, 1)
        I = torch.eye(self.dim, device=A.device)
        
        # Cayley Transform: R = (I - A) @ inv(I + A)
        # Numerically stable for small A.
        R = torch.matmul(torch.inverse(I + A), I - A)
        return R

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Applies the SO(8) rotation to the input tensor.
        Initial input shape: [batch, ..., dim]
        """
        R = self.get_rotation_matrix()
        # x: [..., dim], R: [dim, dim]
        return torch.matmul(x, R)

class SO8TAdaptiveLayer(nn.Module):
    """
    A layer that integrates SO(8) rotation with standard linear transformation.
    """
    def __init__(self, d_model: int):
        super().__init__()
        # We project d_model down to 8 for the SO(8) rotation if needed, 
        # but usually, we apply it to 8-dimensional slices or bottleneck features.
        self.rotation = SO8RotationGate(dim=8)
        self.proj_in = nn.Linear(d_model, 8, bias=False)
        self.proj_out = nn.Linear(8, d_model, bias=False)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # 1. Project to 8D space
        x_8d = self.proj_in(x)
        # 2. Apply SO(8) rotation
        x_rot = self.rotation(x_8d)
        # 3. Project back to d_model
        return self.proj_out(x_rot)
