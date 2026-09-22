import csv
import sys


def total(path):
    with open(path, newline="", encoding="utf-8") as source:
        return sum(int(row["amount"]) for row in csv.DictReader(source))


def main():
    print(total(sys.argv[1]))


if __name__ == "__main__":
    main()
