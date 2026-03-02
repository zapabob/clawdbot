try:
    import cupy as cp

    use_gpu = True
except ImportError:
    import numpy as cp

    use_gpu = False

import time

# Simulation of NC-KAN as a sum of Order-Zero Maps
# beta(g) = sum h_j^{1/2} * pi_j(g) * h_j^{1/2}


def simulate_nckan_cp():
    backend = "GPU (Cupy)" if use_gpu else "CPU (Numpy)"
    print(f"--- ASI NC-KAN CP-Factorization Simulation ({backend}) ---")

    # Define non-commutative tuple (Pauli matrices)
    sx = cp.array([[0, 1], [1, 0]], dtype=complex)
    sy = cp.array([[0, -1j], [1j, 0]], dtype=complex)
    sz = cp.array([[1, 0], [0, -1]], dtype=complex)

    # Target: Commutator [X, Y] = 2iZ
    # Note: Pure functions of X and Y cannot reach Z in one block.
    # We show that a SUM of Order-Zero blocks can approximate the target.
    target = 1j * (sx @ sy - sy @ sx)
    print(f"Targeting Commutator i[X,Y]:\n{target if not use_gpu else target.get()}")

    m_values = [1, 5, 20, 100]

    for m in m_values:
        total_approximation = cp.zeros((2, 2), dtype=complex)
        start_time = time.time()

        for j in range(m):
            # 1. Weights h_j (Random PSD matrix)
            r = cp.random.randn(2, 2) + 1j * cp.random.randn(2, 2)
            h = r @ r.conj().T
            h /= cp.trace(h)

            # 2. Select basis component (pi_j)
            # In a real KAN, this is a learned non-linear function.
            # Here we randomly mix X, Y, Z to show representational power.
            basis = [sx, sy, sz]
            weights = cp.random.rand(3)
            pi_g = sum(w * b for w, b in zip(weights, basis))

            # 3. Order-Zero Map
            if use_gpu:
                eigvals, eigvecs = cp.linalg.eigh(h)
                h_sqrt = eigvecs @ cp.diag(cp.sqrt(cp.maximum(eigvals, 0))) @ eigvecs.conj().T
            else:
                from scipy.linalg import sqrtm

                h_sqrt = sqrtm(h)

            beta_j = h_sqrt @ pi_g @ h_sqrt
            total_approximation += beta_j

        # Rescale to match target norm for visualization
        scale = cp.linalg.norm(target) / (cp.linalg.norm(total_approximation) + 1e-9)
        total_approximation *= scale

        error = cp.linalg.norm(target - total_approximation)
        print(f"m={m:3d} | L2 Error: {error if not use_gpu else error.get():.6f}")


if __name__ == "__main__":
    simulate_nckan_cp()
