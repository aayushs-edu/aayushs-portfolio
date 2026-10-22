package palette

import (
	"math"
	"math/rand"
)

type Color struct{ L, A, B float64 }

func dist2(p, q Color) float64 {
	dl, da, db := p.L-q.L, p.A-q.A, p.B-q.B
	return dl*dl + da*da + db*db
}

// KMeans clusters colours with k-means++ seeding.
func KMeans(px []Color, k, iters int, seed int64) []Color {
	rng := rand.New(rand.NewSource(seed))
	centers := []Color{px[rng.Intn(len(px))]}
	for len(centers) < k {
		best, bestD := 0, -1.0
		for i, p := range px {
			d := math.Inf(1)
			for _, c := range centers {
				d = math.Min(d, dist2(p, c))
			}
			if d > bestD {
				best, bestD = i, d
			}
		}
		centers = append(centers, px[best])
	}

	assign := make([]int, len(px))
	for it := 0; it < iters; it++ {
		sums := make([]Color, k)
		counts := make([]int, k)
		for i, p := range px {
			j, d := 0, math.Inf(1)
			for c := range centers {
				if dc := dist2(p, centers[c]); dc < d {
					j, d = c, dc
				}
			}
			assign[i] = j
			sums[j].L += p.L
			sums[j].A += p.A
			sums[j].B += p.B
			counts[j]++
		}
		for c := range centers {
			if n := float64(counts[c]); n > 0 {
				centers[c] = Color{sums[c].L / n, sums[c].A / n, sums[c].B / n}
			}
		}
	}
	return centers
}
