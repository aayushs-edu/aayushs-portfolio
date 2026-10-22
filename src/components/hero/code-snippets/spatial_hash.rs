use std::collections::HashMap;

/// Uniform grid for broad-phase neighbour queries.
pub struct SpatialHash {
    cell: f32,
    buckets: HashMap<(i32, i32), Vec<usize>>,
}

impl SpatialHash {
    pub fn new(cell: f32) -> Self {
        Self { cell, buckets: HashMap::new() }
    }

    fn key(&self, x: f32, y: f32) -> (i32, i32) {
        ((x / self.cell).floor() as i32, (y / self.cell).floor() as i32)
    }

    pub fn rebuild(&mut self, points: &[(f32, f32)]) {
        self.buckets.clear();
        for (i, &(x, y)) in points.iter().enumerate() {
            let k = self.key(x, y);
            self.buckets.entry(k).or_default().push(i);
        }
    }

    pub fn near(&self, x: f32, y: f32, r: f32) -> Vec<usize> {
        let (cx, cy) = self.key(x, y);
        let reach = (r / self.cell).ceil() as i32;
        let mut out = Vec::new();
        for dx in -reach..=reach {
            for dy in -reach..=reach {
                if let Some(ids) = self.buckets.get(&(cx + dx, cy + dy)) {
                    out.extend_from_slice(ids);
                }
            }
        }
        out
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn finds_neighbours() {
        let mut grid = SpatialHash::new(1.0);
        grid.rebuild(&[(0.2, 0.2), (0.9, 0.4), (5.0, 5.0)]);
        assert_eq!(grid.near(0.5, 0.5, 0.6).len(), 2);
    }
}
