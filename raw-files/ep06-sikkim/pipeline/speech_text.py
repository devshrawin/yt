"""Spoken-form helpers for tts.py: numbers as English words, currency, percentages, dates.

Why: the Multilingual voice reads bare digits with Hindi number words when Devanagari is nearby
(e.g. "814" comes out as a Hindi number). Every digit string is therefore spelled out in English
before synthesis; captions still show the original digits (align_words maps back via spans).
"""
import re

ONES = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split()
TENS = "_ _ twenty thirty forty fifty sixty seventy eighty ninety".split()
SCALES = [(10**9, "billion"), (10**6, "million"), (10**3, "thousand")]


def cardinal(n):
    if n < 20:
        return ONES[n]
    if n < 100:
        return TENS[n // 10] + ("-" + ONES[n % 10] if n % 10 else "")
    if n < 1000:
        return ONES[n // 100] + " hundred" + (" " + cardinal(n % 100) if n % 100 else "")
    for size, name in SCALES:
        if n >= size:
            return cardinal(n // size) + " " + name + (" " + cardinal(n % size) if n % size else "")
    raise ValueError(n)


def year_words(n):
    if 2000 <= n <= 2009:
        return "two thousand" + (" " + ONES[n % 100] if n % 100 else "")
    a, b = divmod(n, 100)
    if b == 0:
        return cardinal(a) + " hundred"
    return cardinal(a) + " " + (("oh " + ONES[b]) if b < 10 else cardinal(b))


def ordinal(n):
    w = cardinal(n)
    head, sep, last = w.rpartition("-") if "-" in w.split(" ")[-1] else w.rpartition(" ")
    irregular = {"one": "first", "two": "second", "three": "third", "five": "fifth", "eight": "eighth",
                 "nine": "ninth", "twelve": "twelfth"}
    if last in irregular:
        last = irregular[last]
    elif last.endswith("y"):
        last = last[:-1] + "ieth"
    else:
        last += "th"
    return head + sep + last


def number_words(digits, dec=None, suffix=None):
    n = int(digits.replace(",", ""))
    if suffix:
        return ordinal(n)
    if dec is not None:
        return cardinal(n) + " point " + " ".join(ONES[int(d)] for d in dec)
    if "," not in digits and 1100 <= n <= 2099:
        return year_words(n)
    return cardinal(n)


NUM = r"(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d+))?(st|nd|rd|th)?"
UNIT = r"(?:\s*(million|billion|thousand|crore|lakh))?"

# (compiled regex, callable(match) -> spoken text); tried in order, first claim on a character wins
RULES = [
    (re.compile(r"(?<![\w$])US\$" + NUM + UNIT), lambda m: _money(m, "US dollars")),
    (re.compile(r"(?<![\w$])HK\$" + NUM + UNIT), lambda m: _money(m, "Hong Kong dollars")),
    (re.compile(r"₹" + NUM + UNIT), lambda m: _money(m, "rupees")),
    (re.compile(r"(?<![\w/])(\d{1,2})/(\d{1,2})(?![\w/])"), lambda m: f"{cardinal(int(m.group(1)))} {cardinal(int(m.group(2)))}"),
    (re.compile(r"(?<![\w.,])" + NUM + r"%"), lambda m: number_words(m.group(1), m.group(2)) + " percent"),
    (re.compile(r"(?<![\w.,])(\d{4})\s*[–-]\s*(\d{2,4})(?![\w])"), lambda m: _range(m)),
    (re.compile(r"(?<![\w.,])(\d+)\s*[–-]\s*(\d+)(?![\w,])"), lambda m: f"{cardinal(int(m.group(1)))} to {cardinal(int(m.group(2)))}"),
    (re.compile(r"(?<![\w.,])" + NUM + r"(?![\w])(?!\.\d)"), lambda m: number_words(m.group(1), m.group(2), m.group(3))),
]


def _money(m, cur):
    unit = f" {m.group(4)}" if m.group(4) else ""
    return number_words(m.group(1), m.group(2)) + unit + " " + cur


def _range(m):
    a, b = m.group(1), m.group(2)
    if len(b) == 2:
        return f"{year_words(int(a))} to {cardinal(int(b))}"
    return f"{year_words(int(a))} to {year_words(int(b))}"


def find_numbers(text, taken):
    """Yield (start, end, spoken) for number-like spans not already claimed (taken is mutated)."""
    for rx, fn in RULES:
        for m in rx.finditer(text):
            if any(taken[m.start():m.end()]):
                continue
            for i in range(m.start(), m.end()):
                taken[i] = True
            yield m.start(), m.end(), fn(m)


if __name__ == "__main__":
    tests = ["In 1971 the war lasted 13 days.", "IC-814 had 190 people; 27 were freed.", "US$200 million and HK$600,000.",
             "The 22nd state, on 16 May 1975, at 97.55%.", "26/11 and 9/11, 1962–63, 8–10 hours, ₹2 crore, 2001.", "October 3, 2009"]
    for t in tests:
        taken = [False] * len(t)
        hits = sorted(find_numbers(t, taken))
        out, cur = [], 0
        for s, e, say in hits:
            out += [t[cur:s], say]
            cur = e
        print("".join(out + [t[cur:]]))
