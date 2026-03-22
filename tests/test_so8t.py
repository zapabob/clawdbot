import torch
import unittest
from src.models.so8t_adapter import SO8TAdapterBank, calculate_pet_loss
from src.layers.so8t_gate import SO8RotationGate
from src.layers.mhc_layer import MHCResidualConnection, sinkhorn_knopp

class TestSO8T(unittest.TestCase):
    def test_adapter_bank_output_shape(self):
        d_model = 128
        r = 16
        bank = SO8TAdapterBank(d_model, r)
        x = torch.randn(1, 10, d_model)
        
        # Test each pass
        for p in range(4):
            out = bank(x, p)
            self.assertEqual(out.shape, x.shape)

    def test_pet_loss_gradient(self):
        d_model = 128
        r = 16
        bank = SO8TAdapterBank(d_model, r)
        bank.alpha.data = torch.tensor([0.1, 0.2, 0.3, 0.4])
        
        loss = calculate_pet_loss(torch.nn.ModuleList([bank]), lambda_g=1.0)
        loss.backward()
        
        self.assertIsNotNone(bank.alpha.grad)
        self.assertTrue(torch.any(bank.alpha.grad != 0))

    def test_so8_rotation_orthogonality(self):
        gate = SO8RotationGate(dim=8)
        R = gate.get_rotation_matrix()
        identity = torch.eye(8, device=R.device)
        RT_R = torch.matmul(R.t(), R)
        self.assertTrue(torch.allclose(RT_R, identity, atol=1e-5))
        det = torch.det(R)
        self.assertTrue(torch.allclose(det, torch.tensor(1.0), atol=1e-5))

    def test_mhc_doubly_stochastic(self):
        W = torch.randn(5, 5)
        ds_W = sinkhorn_knopp(W, iterations=20)
        
        # Row sums should be 1
        row_sums = ds_W.sum(dim=-1)
        self.assertTrue(torch.allclose(row_sums, torch.ones_like(row_sums), atol=1e-5))
        
        # Col sums should be 1
        col_sums = ds_W.sum(dim=-2)
        self.assertTrue(torch.allclose(col_sums, torch.ones_like(col_sums), atol=1e-5))

    def test_mhc_residual_forward(self):
        d_model = 128
        mhc = MHCResidualConnection(d_model)
        x = torch.randn(1, 10, d_model)
        fx = torch.randn(1, 10, d_model)
        out = mhc(x, fx)
        self.assertEqual(out.shape, x.shape)

if __name__ == "__main__":
    unittest.main()
