"""Exact mask equivalence against CP17, including clipped cones and partial fog."""
import unittest,random
from benchmarks.vision_cp17_reference import sight as previous
from token_vision import sight
import fog
class VisionEquivalence(unittest.TestCase):
 def test_masks_match_reference(self):
  rng=random.Random(1801)
  for i in range(50):
   height=rng.choice([250,700,1800]);size=rng.choice([10,35,100]);scale=rng.choice([1,5,10])
   cells=fog.REVEALED if i%2 else ''.join(rng.choice('01') for _ in range(fog.N*fog.N))
   sources=tuple((rng.randint(-15,15),rng.randint(-15,15),rng.choice([0,1,8,30,1000]),rng.choice([1,90,160,360]),rng.choice([0,90,270,360])) for _ in range(i%5))
   with self.subTest(i=i):self.assertEqual(sight(cells,height,size,scale,sources),previous(cells,height,size,scale,sources))
