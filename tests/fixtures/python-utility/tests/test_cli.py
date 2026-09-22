from pathlib import Path
from tempfile import TemporaryDirectory
import unittest

from ledger.cli import total


class TotalTests(unittest.TestCase):
    def test_total(self):
        with TemporaryDirectory() as directory:
            path = Path(directory) / "transactions.csv"
            path.write_text("amount\n5\n-2\n", encoding="utf-8")
            self.assertEqual(total(path), 3)


if __name__ == "__main__":
    unittest.main()
